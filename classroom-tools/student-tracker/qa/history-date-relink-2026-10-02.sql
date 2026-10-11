-- Exact historical correction authorized by Adam on 2026-10-02.
-- The table lock keeps other writers out while the single completion guard is
-- suspended for this relink. All foreign keys and RLS stay in force.
lock table public.randomizer_sessions in share row exclusive mode;
alter table public.randomizer_sessions disable trigger randomizer_session_stays_completed;
do $repair$
declare v_target uuid; v_before timestamptz;
begin
  select id into strict v_target from public.class_sessions
    where owner_id='57815aa8-6671-44e8-a4cf-ad0dd2ccde2d'
      and course_id='f53d3f39-299b-4b3c-a391-4bcfad1d31af'
      and session_date='2026-09-18' and status='completed';
  select completed_at into strict v_before from public.randomizer_sessions
    where id='75ed965f-ceff-48f8-9283-fa25471fd1e3'
      and class_session_id='6622ee34-a100-44f5-9ea3-9b7f44208f92'
      and owner_id='57815aa8-6671-44e8-a4cf-ad0dd2ccde2d'
      and course_id='f53d3f39-299b-4b3c-a391-4bcfad1d31af'
      and session_date='2026-09-18' and status='completed' for update;
  if (select count(*) from public.randomizer_attempts where randomizer_session_id='75ed965f-ceff-48f8-9283-fa25471fd1e3')<>47
    then raise exception 'Attempt count changed'; end if;
  update public.randomizer_sessions set class_session_id=v_target
    where id='75ed965f-ceff-48f8-9283-fa25471fd1e3';
  if not exists(select 1 from public.randomizer_sessions
    where id='75ed965f-ceff-48f8-9283-fa25471fd1e3' and class_session_id=v_target
    and status='completed' and completed_at is not distinct from v_before)
    then raise exception 'Relink did not persist'; end if;
  insert into public.class_session_corrections(owner_id,course_id,class_session_id,
    previous_session_date,next_session_date,reason)
    values('57815aa8-6671-44e8-a4cf-ad0dd2ccde2d','f53d3f39-299b-4b3c-a391-4bcfad1d31af',v_target,
    '2026-09-18','2026-09-18',
    'Adam 确认的历史关联修正：首次更新被已完成课次保护触发器还原；本次在事务内锁表修复关联并回读验证。47 笔回答保留，未修改完成状态或完成时间。');
end;
$repair$;
alter table public.randomizer_sessions enable trigger randomizer_session_stays_completed;
