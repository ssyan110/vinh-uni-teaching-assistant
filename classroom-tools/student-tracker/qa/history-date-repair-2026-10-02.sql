-- Authorized by Adam in this chat; inspect assertions before executing.
-- Wrap in BEGIN/ROLLBACK for dry-run, or BEGIN/COMMIT for the approved repair.
do $repair$
declare
  v_new_id uuid;
  v_count integer;
  v_owner uuid := '57815aa8-6671-44e8-a4cf-ad0dd2ccde2d';
begin
  perform 1 from public.class_sessions
    where id='6622ee34-a100-44f5-9ea3-9b7f44208f92' and owner_id=v_owner
      and course_id='f53d3f39-299b-4b3c-a391-4bcfad1d31af' and session_date='2026-09-11'
    for update;
  if not found then raise exception 'LT03 source changed'; end if;
  perform 1 from public.randomizer_sessions
    where id='75ed965f-ceff-48f8-9283-fa25471fd1e3' and owner_id=v_owner
      and class_session_id='6622ee34-a100-44f5-9ea3-9b7f44208f92' and session_date='2026-09-18'
    for update;
  if not found then raise exception 'LT03 randomizer link changed'; end if;
  select count(*) into v_count from public.randomizer_attempts
    where randomizer_session_id='75ed965f-ceff-48f8-9283-fa25471fd1e3' and owner_id=v_owner;
  if v_count<>47 then raise exception 'LT03 attempt count changed: %',v_count; end if;
  if exists(select 1 from public.class_sessions where owner_id=v_owner
    and course_id='f53d3f39-299b-4b3c-a391-4bcfad1d31af' and session_date='2026-09-18')
    then raise exception 'LT03 target date already exists'; end if;
  insert into public.class_sessions(owner_id,course_id,session_date,status,topic,observation_target,completed_at)
    select owner_id,course_id,'2026-09-18','completed',topic,observation_target,completed_at
    from public.class_sessions where id='6622ee34-a100-44f5-9ea3-9b7f44208f92'
    returning id into v_new_id;
  update public.randomizer_sessions set class_session_id=v_new_id
    where id='75ed965f-ceff-48f8-9283-fa25471fd1e3' and owner_id=v_owner;
  insert into public.class_session_corrections(owner_id,course_id,class_session_id,
    previous_session_date,next_session_date,previous_session_number,next_session_number,reason)
    values(v_owner,'f53d3f39-299b-4b3c-a391-4bcfad1d31af','6622ee34-a100-44f5-9ea3-9b7f44208f92',
    '2026-09-11','2026-09-11',null,null,
    'Adam 确认 2026-10-02：将抽问场次 75ed965f-ceff-48f8-9283-fa25471fd1e3 的 47 笔原始记录重新关联至 2026-09-18 课次 '||v_new_id||'；保留 9 月 11 日的其余记录，未修改回答。');

  perform 1 from public.class_sessions
    where id='39350db6-b344-4110-bd01-e28f9008970c' and owner_id=v_owner
      and course_id='a90ebf15-aeb2-4680-9943-381466045405' and session_date='2026-09-27'
    for update;
  if not found then raise exception 'NNTQ1 source changed'; end if;
  if exists(select 1 from public.class_sessions where owner_id=v_owner
    and course_id='a90ebf15-aeb2-4680-9943-381466045405' and session_date='2026-09-28')
    then raise exception 'NNTQ1 target date already exists'; end if;
  if (select count(*) from public.randomizer_sessions
    where class_session_id='39350db6-b344-4110-bd01-e28f9008970c')<>1
    or not exists(select 1 from public.randomizer_sessions
    where id='24171acc-a054-4beb-abf9-1d54641efe8c' and owner_id=v_owner
      and class_session_id='39350db6-b344-4110-bd01-e28f9008970c' and session_date='2026-09-28')
    then raise exception 'NNTQ1 links changed'; end if;
  select count(*) into v_count from public.randomizer_attempts
    where randomizer_session_id='24171acc-a054-4beb-abf9-1d54641efe8c' and owner_id=v_owner;
  if v_count<>41 then raise exception 'NNTQ1 attempt count changed: %',v_count; end if;
  insert into public.class_session_corrections(owner_id,course_id,class_session_id,
    previous_session_date,next_session_date,previous_session_number,next_session_number,reason)
    select owner_id,course_id,id,session_date,'2026-09-28',session_number,session_number,
    'Adam 确认 2026-10-02：NNTQ1 实际上课日为 2026-09-28；按对应抽问场次日期修正原课次日期，保留全部 41 笔原始记录。'
    from public.class_sessions where id='39350db6-b344-4110-bd01-e28f9008970c';
  update public.class_sessions set session_date='2026-09-28'
    where id='39350db6-b344-4110-bd01-e28f9008970c' and owner_id=v_owner;
end;
$repair$;
