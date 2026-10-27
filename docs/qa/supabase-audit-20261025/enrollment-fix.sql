-- Preserve session-level evidence when an enrollment is removed or reassigned.
create function public.guard_enrollment_evidence()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='UPDATE' and new.owner_id=old.owner_id and new.course_id=old.course_id
    and new.student_id=old.student_id then return new; end if;
  if exists (
    select 1 from public.class_sessions s
    where s.owner_id=old.owner_id and s.course_id=old.course_id and (
      exists(select 1 from public.attendance_records a where a.owner_id=old.owner_id and a.session_id=s.id and a.student_id=old.student_id)
      or exists(select 1 from public.observation_records a where a.owner_id=old.owner_id and a.session_id=s.id and a.student_id=old.student_id)
      or exists(select 1 from public.attendance_exceptions a where a.owner_id=old.owner_id and a.session_id=s.id and a.student_id=old.student_id)
    )
  ) then
    raise exception 'Enrollment has classroom evidence; retain it and change its status instead'
      using errcode='23503';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.guard_enrollment_evidence() from public, anon, authenticated;
create trigger enrollment_evidence_guard before delete or update on public.enrollments
  for each row execute function public.guard_enrollment_evidence();

