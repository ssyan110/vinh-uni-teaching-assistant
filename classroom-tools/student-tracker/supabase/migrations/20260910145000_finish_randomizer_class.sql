-- Close a teacher's exact linked class and its randomizer sessions together.
-- Answer records and teacher reflections are preserved.
create or replace function public.finish_randomizer_class(p_client_session_id text)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_class_id uuid; v_course_id uuid; v_completed_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select class_session_id, course_id into v_class_id, v_course_id
    from public.randomizer_sessions
    where owner_id = auth.uid() and client_session_id = p_client_session_id;
  if v_class_id is null then raise exception 'Class session not found'; end if;
  select coalesce(completed_at, now()) into v_completed_at from public.class_sessions
    where id = v_class_id and course_id = v_course_id and owner_id = auth.uid() for update;
  if not found then raise exception 'Class session not accessible'; end if;
  update public.randomizer_sessions set status = 'completed', completed_at = coalesce(completed_at, v_completed_at)
    where class_session_id = v_class_id and course_id = v_course_id and owner_id = auth.uid();
  update public.class_sessions set status = 'completed', completed_at = v_completed_at
    where id = v_class_id and course_id = v_course_id and owner_id = auth.uid();
end;
$$;
revoke all on function public.finish_randomizer_class(text) from public, anon;
grant execute on function public.finish_randomizer_class(text) to authenticated;

-- Old/offline clients must not reopen a completed session during an upsert.
create or replace function public.keep_randomizer_session_completed()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status = 'completed' then
    new.status := 'completed';
    new.completed_at := old.completed_at;
    new.class_session_id := old.class_session_id;
    new.course_id := old.course_id;
  end if;
  return new;
end;
$$;
revoke all on function public.keep_randomizer_session_completed() from public, anon, authenticated;
create trigger randomizer_session_stays_completed before update on public.randomizer_sessions
  for each row execute function public.keep_randomizer_session_completed();
