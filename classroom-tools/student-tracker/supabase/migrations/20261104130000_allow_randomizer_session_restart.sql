begin;

drop function if exists public.ensure_class_session(uuid, date);

create function public.ensure_class_session(
  p_course_id uuid,
  p_session_date date,
  p_allow_restart boolean default false
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_session public.class_sessions%rowtype;
begin
  if auth.uid() is null then raise exception '请先登录教师账号。'; end if;
  if p_session_date is null then raise exception '请填写有效上课日期。'; end if;

  perform 1 from public.courses where id=p_course_id and owner_id=auth.uid() for update;
  if not found then raise exception '找不到本班或没有访问权限。'; end if;

  select * into v_session from public.class_sessions
    where course_id=p_course_id and owner_id=auth.uid() and status='in_progress'
    for update;
  if found then
    if v_session.session_date = p_session_date then return v_session.id; end if;
    if not p_allow_restart then
      raise exception '本班 % 的课次尚未收尾，不能写入 % 的记录。请先核对并完成旧课次；本机记录已保留。', v_session.session_date, p_session_date;
    end if;
    if exists (select 1 from public.class_sessions
      where course_id=p_course_id and owner_id=auth.uid() and session_date=p_session_date) then
      raise exception '本班 % 已有课堂。补记请在学生管理系统选择原课次，不另建重复课堂。', p_session_date;
    end if;
    update public.class_sessions
      set status='completed', completed_at=coalesce(completed_at,now())
      where id=v_session.id and course_id=p_course_id and owner_id=auth.uid();
  end if;

  if exists (select 1 from public.class_sessions
    where course_id=p_course_id and owner_id=auth.uid() and session_date=p_session_date) then
    raise exception '本班 % 已有课堂。补记请在学生管理系统选择原课次，不另建重复课堂。', p_session_date;
  end if;

  insert into public.class_sessions(owner_id,course_id,session_date,status)
    values(auth.uid(),p_course_id,p_session_date,'in_progress') returning id into v_session.id;
  return v_session.id;
end;
$$;

revoke all on function public.ensure_class_session(uuid, date, boolean) from public, anon;
grant execute on function public.ensure_class_session(uuid, date, boolean) to authenticated;

notify pgrst, 'reload schema';
commit;
