-- Teacher selection, round skips, shared classroom identity and safe replay.
begin;
alter table public.randomizer_attempts
  drop constraint randomizer_attempts_selection_method_check,
  add constraint randomizer_attempts_selection_method_check
    check (selection_method in ('random', 'volunteer', 'teacher')),
  drop constraint randomizer_attempts_event_type_check,
  add constraint randomizer_attempts_event_type_check
    check (event_type in ('random_call', 'voluntary_speaking', 'teacher_call'));
alter table public.randomizer_attempts
  add column round_skipped boolean not null default false,
  add column source_updated_at timestamptz,
  add constraint randomizer_attempts_round_skip_check
    check (not round_skipped or outcome in ('not_answered', 'undone'));

-- Both clients resolve the same active classroom inside one transaction.
-- A course row lock serializes simultaneous starts without creating two IDs.
create or replace function public.ensure_class_session(p_course_id uuid, p_session_date date)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_session public.class_sessions%rowtype;
begin
  if auth.uid() is null then raise exception '请先登录教师账号。'; end if;
  if p_session_date is null then raise exception '请填写有效上课日期。'; end if;
  perform 1 from public.courses where id=p_course_id and owner_id=auth.uid() for update;
  if not found then raise exception '找不到本班或没有访问权限。'; end if;
  select * into v_session from public.class_sessions
    where course_id=p_course_id and owner_id=auth.uid() and status='in_progress';
  if found then
    if v_session.session_date <> p_session_date then
      raise exception '本班 % 的课次尚未收尾，不能写入 % 的记录。请先核对并完成旧课次；本机记录已保留。', v_session.session_date, p_session_date;
    end if;
    return v_session.id;
  end if;
  if exists (select 1 from public.class_sessions
    where course_id=p_course_id and owner_id=auth.uid() and session_date=p_session_date) then
    raise exception '本班 % 已有结束的课堂。补记请在学生管理系统选择原课次，不另建重复课堂。', p_session_date;
  end if;
  insert into public.class_sessions(owner_id,course_id,session_date,status)
    values(auth.uid(),p_course_id,p_session_date,'in_progress') returning id into v_session.id;
  return v_session.id;
end;
$$;
revoke all on function public.ensure_class_session(uuid,date) from public,anon;
grant execute on function public.ensure_class_session(uuid,date) to authenticated;

-- Old clients cannot create a second classroom for a date already recorded.
create or replace function public.guard_class_session_start()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.courses where id=new.course_id and owner_id=new.owner_id for update;
  if exists(select 1 from public.class_sessions
    where owner_id=new.owner_id and course_id=new.course_id and session_date=new.session_date) then
    raise exception '本班该日期已有课堂，请连接原课次。' using errcode='23505';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_class_session_start() from public,anon,authenticated;
create trigger class_session_start_guard before insert on public.class_sessions
  for each row execute function public.guard_class_session_start();

-- Stable identity: a retry must never move an existing randomizer to another class.
create or replace function public.guard_randomizer_class_link()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_class public.class_sessions%rowtype;
begin
  if tg_op='UPDATE' and (new.class_session_id<>old.class_session_id or new.course_id<>old.course_id
    or new.owner_id<>old.owner_id or new.client_session_id<>old.client_session_id) then
    raise exception '抽问记录已关联固定课次，不能在重试时改挂另一堂课。';
  end if;
  select * into v_class from public.class_sessions
    where id=new.class_session_id and owner_id=new.owner_id and course_id=new.course_id;
  if not found then raise exception '找不到对应的课堂。'; end if;
  new.session_date := v_class.session_date;
  if v_class.status='completed' then
    new.status := 'completed';
    new.completed_at := coalesce(new.completed_at,v_class.completed_at,now());
  end if;
  return new;
end;
$$;
revoke all on function public.guard_randomizer_class_link() from public,anon,authenticated;
create trigger randomizer_class_link_guard before insert or update on public.randomizer_sessions
  for each row execute function public.guard_randomizer_class_link();

-- Date corrections and closing from the tracker update its linked mirrors.
create or replace function public.sync_class_session_randomizers()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  update public.randomizer_sessions set session_date=new.session_date,
    status=case when new.status='completed' then 'completed' else status end,
    completed_at=case when new.status='completed' then coalesce(completed_at,new.completed_at,now()) else completed_at end
    where owner_id=new.owner_id and course_id=new.course_id and class_session_id=new.id;
  return new;
end;
$$;
revoke all on function public.sync_class_session_randomizers() from public,anon,authenticated;
create trigger class_session_randomizer_sync after update of session_date,status on public.class_sessions
  for each row execute function public.sync_class_session_randomizers();

-- Replay changes only raw answers; it cannot undo a tracker correction or score.
create or replace function public.guard_randomizer_attempt_replay()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.randomizer_session_id<>old.randomizer_session_id or new.course_id<>old.course_id
    or new.owner_id<>old.owner_id or new.client_attempt_id<>old.client_attempt_id then
    raise exception '发言记录不能在重试时改挂另一堂课。';
  end if;
  if old.record_status='corrected' and new.record_status<>'corrected' then return old; end if;
  if new.assessment_status in ('pending','not_applicable') and old.source_updated_at is not null and (new.source_updated_at is null
    or new.source_updated_at<old.source_updated_at) then return old; end if;
  if old.assessment_status in ('observed','scored') and new.assessment_status in ('pending','not_applicable') then
    new.assessment_status := old.assessment_status;
    new.performance_level := old.performance_level;
    new.observation_version := old.observation_version;
    new.fact_marks := old.fact_marks;
    new.fact_version := old.fact_version;
    new.task_completion := old.task_completion;
    new.comprehensibility := old.comprehensibility;
    new.language_control_vocabulary := old.language_control_vocabulary;
    new.content_interaction := old.content_interaction;
    new.total_score := old.total_score;
    new.score := old.score;
    new.counted_for_grade := old.counted_for_grade;
    new.counted_for_summary := old.counted_for_summary;
    new.outcome := old.outcome;
    new.response_status := old.response_status;
    new.completed_at := old.completed_at;
    new.no_response_reason := old.no_response_reason;
  end if;
  return new;
end;
$$;
revoke all on function public.guard_randomizer_attempt_replay() from public,anon,authenticated;
create trigger randomizer_attempt_replay_guard before update on public.randomizer_attempts
  for each row execute function public.guard_randomizer_attempt_replay();
commit;
