-- Exact cleanup authorized by Adam in this chat on 2026-10-25:
-- Same LT_02 class; keep all 33 randomizer attempts and delete the 30 manual replacements.
begin;
set local lock_timeout='5s';
do $audit$
declare
  src public.class_sessions%rowtype;
  dst public.class_sessions%rowtype;
  before_raw jsonb; after_raw jsonb; affected integer;
begin
  perform 1 from public.courses where id='2c8dea64-2349-43c3-8484-8587f1a0b630' for update;
  select * into strict src from public.class_sessions where id='cceb4c88-39f5-4a5a-a540-92223521ac5a' for update;
  select * into strict dst from public.class_sessions where id='b191bbe0-25bb-437e-8428-03eb5156ad93' for update;
  if src.owner_id<>dst.owner_id or src.course_id<>dst.course_id or src.session_date<>dst.session_date
    or src.session_date<>'2026-09-10' or src.session_number<>1 or dst.session_number is not null
    or src.status<>'completed' or dst.status<>'completed' then raise exception 'Session preflight changed'; end if;
  if src.topic is not null or src.what_worked is not null or src.class_status is not null
    or src.progress_text is not null or src.next_adjustment is not null or src.common_difficulty is not null
    or src.observation_target is not null then raise exception 'Source has extra teacher content'; end if;
  select jsonb_agg(to_jsonb(a) order by a.id) into before_raw from public.randomizer_attempts a
    join public.randomizer_sessions r on r.id=a.randomizer_session_id where r.class_session_id=dst.id;
  if jsonb_array_length(before_raw)<>33 then raise exception 'Expected 33 original attempts'; end if;
  if (select count(*) from public.learning_events where session_id=src.id)<>30
    or exists(select 1 from public.learning_events where session_id=src.id and source<>'manual_adjustment')
    or exists(select 1 from public.learning_events e join public.classroom_record_corrections c
      on c.record_type='learning_event' and c.record_id=e.id where e.session_id=src.id)
    or exists(select 1 from public.randomizer_sessions where class_session_id=src.id)
    or exists(select 1 from public.attendance_records where session_id=src.id)
    or exists(select 1 from public.observation_records where session_id=src.id)
    or exists(select 1 from public.attendance_exceptions where session_id=src.id)
    or exists(select 1 from public.followups where session_id=src.id)
    then raise exception 'Source references changed; stop'; end if;
  delete from public.learning_events where session_id=src.id and source='manual_adjustment';
  get diagnostics affected=row_count;
  if affected<>30 then raise exception 'Manual deletion count changed'; end if;
  -- Preserve the original session-date correction history under the retained class.
  update public.class_session_corrections set class_session_id=dst.id
    where owner_id=src.owner_id and course_id=src.course_id and class_session_id=src.id;
  delete from public.class_sessions where id=src.id and owner_id=src.owner_id;
  if not found then raise exception 'Source session was not removed'; end if;
  perform set_config('request.jwt.claim.sub',dst.owner_id::text,true);
  perform public.correct_class_session(dst.id,dst.session_date,1,
    'Adam confirmed 2026-10-25: same LT_02 class. Retained 33 original randomizer attempts; deleted 30 manual replacements that were added because original attempts were not visible. Consolidated duplicate session cceb4c88-39f5-4a5a-a540-92223521ac5a; preserved its correction history.');
  select jsonb_agg(to_jsonb(a) order by a.id) into after_raw from public.randomizer_attempts a
    join public.randomizer_sessions r on r.id=a.randomizer_session_id where r.class_session_id=dst.id;
  if before_raw is distinct from after_raw then raise exception 'Original attempts changed'; end if;
  if (select count(*) from public.class_sessions where owner_id=dst.owner_id and course_id=dst.course_id
    and session_date=dst.session_date)<>1 then raise exception 'Duplicate class remains'; end if;
end $audit$;
commit;
select 'PASS: 33 original attempts unchanged; exactly 30 manual replacements removed; one class retained; original correction history preserved' result;

