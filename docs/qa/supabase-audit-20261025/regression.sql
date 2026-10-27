-- Synthetic fixtures only; every write rolls back. Requires an existing course owner.
begin;
select set_config('request.jwt.claim.sub',(select owner_id::text from public.courses limit 1),true);
set local role authenticated;
do $$
declare
  own uuid := auth.uid(); term uuid; c1 uuid; c2 uuid; s1 uuid; s2 uuid;
  a uuid; b uuid; room uuid; q uuid := gen_random_uuid(); answer uuid := gen_random_uuid();
  teacher text := repeat('t',64); pupil text := repeat('s',64); r jsonb; rejected boolean;
begin
  assert own is not null, 'Needs existing owner';
  select term_id into term from public.courses where owner_id=own limit 1;
  insert into public.courses(owner_id,term_id,code,name)
    values(own,term,'QA-'||gen_random_uuid(),'Synthetic audit A') returning id into c1;
  insert into public.courses(owner_id,term_id,code,name)
    values(own,term,'QA-'||gen_random_uuid(),'Synthetic audit B') returning id into c2;
  insert into public.students(owner_id,student_code,chinese_name)
    values(own,'QA-'||gen_random_uuid(),'Synthetic A') returning id into s1;
  insert into public.students(owner_id,student_code,chinese_name)
    values(own,'QA-'||gen_random_uuid(),'Synthetic B') returning id into s2;
  insert into public.enrollments(owner_id,course_id,student_id) values(own,c1,s1),(own,c2,s2);
  a := public.ensure_class_session(c1,'2098-01-01');
  b := public.ensure_class_session(c2,'2098-01-01');
  insert into public.attendance_records(owner_id,session_id,student_id,status) values(own,a,s1,'present');
  begin
    insert into public.attendance_records(owner_id,session_id,student_id,status) values(own,a,s2,'present');
    raise exception 'Cross-class attendance accepted';
  exception when check_violation then null; end;
  begin
    insert into public.observation_records(owner_id,session_id,student_id,result) values(own,a,s2,'independent');
    raise exception 'Cross-class observation accepted';
  exception when check_violation then null; end;
  insert into public.observation_records(owner_id,session_id,student_id,result) values(own,a,s1,'with_prompt');
  begin
    delete from public.enrollments where owner_id=own and course_id=c1 and student_id=s1;
    raise exception 'Enrollment removal orphaned classroom evidence';
  exception when foreign_key_violation then null; end;
  update public.enrollments set status='withdrawn' where owner_id=own and course_id=c1 and student_id=s1;
  update public.enrollments set status='active' where owner_id=own and course_id=c1 and student_id=s1;
  begin
    insert into public.followups(owner_id,course_id,student_id,session_id,kind,title)
      values(own,c1,s1,b,'remind','Synthetic');
    raise exception 'Cross-class followup session accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.followups(owner_id,course_id,student_id,session_id,kind,title)
      values(own,c1,s2,a,'remind','Synthetic');
    raise exception 'Cross-class followup student accepted';
  exception when foreign_key_violation then null; end;
  insert into public.followups(owner_id,course_id,student_id,session_id,kind,title)
    values(own,c1,s1,a,'remind','Synthetic');
  update public.class_sessions set status='completed',completed_at=now() where id=a;
  begin
    update public.class_sessions set status='in_progress',completed_at=null where id=a;
    raise exception 'Completed session reopened';
  exception when raise_exception then
    if sqlerrm<>'Completed classrooms cannot be reopened by a stale write' then raise; end if;
  end;
  a := public.ensure_class_session(c1,'2098-01-02');
  begin
    perform public.correct_class_session(a,'2098-01-01',null,'Synthetic collision');
    raise exception 'Date correction collision accepted';
  exception when unique_violation then null; end;
  assert not exists(select 1 from public.class_session_corrections where class_session_id=a),
    'Failed correction retained audit row';
  insert into public.attendance_exceptions(owner_id,session_id,student_id,observed_status,reason)
    values(own,a,s1,'present','Synthetic exception');
  begin
    insert into public.attendance_exceptions(owner_id,session_id,student_id,observed_status,reason)
      values(own,a,s2,'present','Synthetic invalid exception');
    raise exception 'Cross-class attendance exception accepted';
  exception when check_violation then null; end;
  begin
    update public.attendance_exceptions set official_status='confirmed' where session_id=a;
    raise exception 'Official verification without makeup accepted';
  exception when check_violation then null; end;
  update public.attendance_exceptions set makeup_status='completed',makeup_date='2098-01-02' where session_id=a;
  assert (select official_status='unverified' from public.attendance_exceptions where session_id=a),
    'Makeup incorrectly implies official verification';
  update public.attendance_exceptions set official_status='confirmed',verified_on='2098-01-03' where session_id=a;
  assert not has_table_privilege('authenticated','public.students','TRUNCATE'), 'TRUNCATE still allowed';
  assert not has_table_privilege('anon','public.students','SELECT'), 'Anonymous roster access';
  assert not has_function_privilege('anon','public.correct_class_session(uuid,date,integer,text)','EXECUTE'),
    'Anonymous correction access';
  r := public.interact_classroom('create',null,teacher,jsonb_build_object('title','Synthetic audit'));
  room := (r->>'code')::uuid;
  begin
    perform public.interact_classroom('end',room,null,'{}');
    raise exception 'NULL teacher token accepted';
  exception when raise_exception then
    if sqlerrm<>'请刷新页面后重试。' then raise; end if;
  end;
  begin
    perform public.interact_classroom('end',room,pupil,'{}');
    raise exception 'Wrong teacher token accepted';
  exception when raise_exception then
    if sqlerrm<>'只有老师可以操作课堂。' then raise; end if;
  end;
  r := public.interact_classroom('update',room,teacher,jsonb_build_object('revision',0,'questions',
    jsonb_build_array(jsonb_build_object('id',q,'type','multiple_choice','status','active',
    'promptText','Synthetic question','options',jsonb_build_array('A','B'),
    'correctAnswers',jsonb_build_array('A'),'allowMultiple',false))));
  r := public.interact_classroom('read',room,pupil,'{}');
  assert r->'questions'->0->'correctAnswers'='[]'::jsonb, 'Student received answer key';
  r := public.interact_classroom('answer',room,pupil,jsonb_build_object('id',answer,'questionId',q,'name','Synthetic','value','A'));
  r := public.interact_classroom('answer',room,pupil,jsonb_build_object('id',answer,'questionId',q,'name','Synthetic','value','A'));
  assert jsonb_array_length(r->'answers')=1, 'Retry duplicated answer';
  r := public.interact_classroom('read',room,repeat('x',64),'{}');
  assert r->'answers'='[]'::jsonb, 'Another participant received private answers';
  r := public.interact_classroom('end',room,teacher,'{}');
  assert (r->>'ended')::boolean, 'Valid teacher could not end room';
end $$;
-- A different JWT subject cannot see any teacher-owned data or forge an owner.
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000099',true);
do $$ begin
  assert not exists(select 1 from public.students), 'Cross-owner student read';
  assert not exists(select 1 from public.attendance_exceptions), 'Cross-owner exception read';
  assert not exists(select 1 from public.classroom_record_corrections), 'Cross-owner audit read';
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform * from public.interact_rooms; raise exception 'Direct room access allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: membership, date collision, closure, attendance exception, privileges, token authorization, answer privacy, idempotency, owner isolation; all fixture writes rolled back' result;
