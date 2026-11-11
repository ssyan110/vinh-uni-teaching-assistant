-- Run after the migration. All synthetic rows and changes are rolled back.
begin;
select set_config('request.jwt.claim.sub',(select owner_id::text from public.courses limit 1),true);
set local role authenticated;
do $$
declare v_course uuid; v_class uuid; v_other uuid; v_randomizer uuid; v_attempt uuid;
  v_owner uuid := auth.uid(); v_row public.randomizer_attempts%rowtype; v_count integer;
begin
  if v_owner is null then raise exception 'Test needs an existing course owner'; end if;
  insert into public.courses(owner_id,term_id,code,name)
    values(v_owner,(select term_id from public.courses where owner_id=v_owner limit 1),
      'QA-'||substr(gen_random_uuid()::text,1,8),'Synthetic session safety check') returning id into v_course;
  v_class := public.ensure_class_session(v_course,'2099-01-01');
  assert public.ensure_class_session(v_course,'2099-01-01')=v_class, 'Repeated starts created a different class ID';
  begin
    perform public.ensure_class_session(v_course,'2099-01-02');
    raise exception 'Different active date was not rejected';
  exception when others then
    if sqlerrm not like '%尚未收尾%' then raise; end if;
  end;
  begin
    insert into public.class_sessions(owner_id,course_id,session_date) values(v_owner,v_course,'2099-01-01');
    raise exception 'Legacy duplicate insert was not rejected';
  exception when unique_violation then null;
  end;
  insert into public.randomizer_sessions(owner_id,course_id,class_session_id,client_session_id,session_date,
    textbook_id,lesson_id,scoring_mode,task_mode,task_target)
    values(v_owner,v_course,v_class,'qa-'||gen_random_uuid(),'2099-01-01','boya-quasi-intermediate-i','lesson-01','practice','oral','answer') returning id into v_randomizer;
  insert into public.randomizer_attempts(owner_id,course_id,randomizer_session_id,client_attempt_id,student_code,student_name,
    round_number,event_order,event_type,selection_method,opportunity_status,response_status,outcome,assessment_status,
    textbook_id,lesson_id,task_mode,task_target,rubric_id,rubric_version,drawn_at,completed_at,source_updated_at)
    values(v_owner,v_course,v_randomizer,'qa-'||gen_random_uuid(),'QA001','Synthetic',1,1,'teacher_call','teacher','called','answered','answered','pending',
      'boya-quasi-intermediate-i','lesson-01','oral','answer','response','1.0',now(),now(),'2099-01-01T02:00:00Z') returning id into v_attempt;
  update public.randomizer_attempts set note='new' where id=v_attempt;
  update public.randomizer_attempts set note='stale',source_updated_at='2099-01-01T01:00:00Z' where id=v_attempt;
  select * into v_row from public.randomizer_attempts where id=v_attempt;
  assert v_row.note='new', 'Stale replay overwrote newer raw answer';
  update public.randomizer_attempts set assessment_status='observed',performance_level='complete',observation_version='1.0' where id=v_attempt;
  update public.randomizer_attempts set assessment_status='pending',source_updated_at='2099-01-01T03:00:00Z' where id=v_attempt;
  select * into v_row from public.randomizer_attempts where id=v_attempt;
  assert v_row.assessment_status='observed' and v_row.performance_level='complete', 'Raw replay erased teacher observation';
  update public.randomizer_attempts set performance_level='needs_support' where id=v_attempt;
  select * into v_row from public.randomizer_attempts where id=v_attempt;
  assert v_row.performance_level='needs_support', 'Guard blocked a legitimate tracker observation edit';
  perform public.correct_classroom_record('randomizer_attempt',v_attempt,'Synthetic correction check');
  update public.randomizer_attempts set record_status='valid',assessment_status='pending',source_updated_at='2099-01-01T04:00:00Z' where id=v_attempt;
  select * into v_row from public.randomizer_attempts where id=v_attempt;
  assert v_row.record_status='corrected' and not v_row.counted_for_summary, 'Replay resurrected corrected answer';
  insert into public.randomizer_attempts(owner_id,course_id,randomizer_session_id,client_attempt_id,student_code,student_name,
    round_number,event_order,event_type,selection_method,opportunity_status,response_status,outcome,assessment_status,no_response_reason,round_skipped,
    textbook_id,lesson_id,task_mode,task_target,rubric_id,rubric_version,drawn_at,completed_at)
    values(v_owner,v_course,v_randomizer,'qa-'||gen_random_uuid(),'QA002','Synthetic skip',1,2,'teacher_call','teacher','called','no_response','not_answered','not_applicable','time_insufficient',true,
      'boya-quasi-intermediate-i','lesson-01','oral','answer','response','1.0',now(),now());
  update public.class_sessions set session_date='2099-01-02',status='completed',completed_at=now() where id=v_class;
  select count(*) into v_count from public.randomizer_sessions where id=v_randomizer and session_date='2099-01-02' and status='completed';
  assert v_count=1, 'Class date/status was not propagated to its linked randomizer';
  update public.randomizer_sessions set session_date='2099-01-01',status='in_progress',completed_at=null where id=v_randomizer;
  select count(*) into v_count from public.randomizer_sessions where id=v_randomizer and session_date='2099-01-02' and status='completed';
  assert v_count=1, 'Replay reopened or changed the corrected classroom';
  begin
    perform public.ensure_class_session(v_course,'2099-01-02');
    raise exception 'Ended classroom was silently duplicated';
  exception when others then
    if sqlerrm not like '%已有结束%' then raise; end if;
  end;
  v_other := public.ensure_class_session(v_course,'2099-01-03');
  begin
    update public.randomizer_sessions set class_session_id=v_other where id=v_randomizer;
    raise exception 'Randomizer was moved to another classroom';
  exception when others then
    if sqlerrm not like '%不能在重试%' then raise; end if;
  end;
  raise notice 'PASS: session binding, duplicate/date rejection, skips, stale replay, correction/observation and closure protection';
end;
$$;
select 'PASS: session binding, date/duplicate rejection, skip, replay, correction, observation, closure' as result;
rollback;
