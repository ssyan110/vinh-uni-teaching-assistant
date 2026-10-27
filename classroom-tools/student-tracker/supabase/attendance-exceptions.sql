-- Applied on 2026-10-25 as migrations/20261025163339_attendance_exceptions.sql.
-- Kept as the standalone SQL input for the disposable local regression harness.
-- Do not reapply this file to an existing database; use versioned migrations.
begin;
create table public.attendance_exceptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  session_id uuid not null,
  student_id uuid not null,
  observed_status text not null check (observed_status in ('present', 'late', 'absent', 'excused')),
  arrival_time time,
  departure_time time,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  makeup_status text not null default 'pending' check (makeup_status in ('pending', 'completed')),
  makeup_date date,
  official_status text not null default 'unverified' check (official_status in ('unverified', 'confirmed')),
  verified_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id),
  foreign key (owner_id, session_id) references public.class_sessions(owner_id, id),
  foreign key (owner_id, student_id) references public.students(owner_id, id),
  check (arrival_time is null or departure_time is null or departure_time >= arrival_time),
  check ((makeup_status = 'pending' and makeup_date is null) or (makeup_status = 'completed' and makeup_date is not null)),
  check ((official_status = 'unverified' and verified_on is null) or (official_status = 'confirmed' and verified_on is not null and makeup_status = 'completed'))
);

create function public.validate_attendance_exception_enrollment()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (
    select 1 from public.class_sessions s
    join public.enrollments e on e.course_id = s.course_id and e.owner_id = s.owner_id
    where s.id = new.session_id and s.owner_id = new.owner_id and e.student_id = new.student_id
  ) then
    raise exception 'Student does not belong to this classroom' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger attendance_exception_enrollment before insert or update on public.attendance_exceptions
  for each row execute function public.validate_attendance_exception_enrollment();
create trigger attendance_exceptions_updated_at before update on public.attendance_exceptions
  for each row execute function public.set_updated_at();
create index attendance_exceptions_owner_pending_idx on public.attendance_exceptions(owner_id, makeup_status);
create index attendance_exceptions_student_idx on public.attendance_exceptions(student_id);
create index attendance_exceptions_owner_session_idx on public.attendance_exceptions(owner_id, session_id);
alter table public.attendance_exceptions enable row level security;
revoke all on public.attendance_exceptions from public, anon, authenticated;
grant select, insert, update on public.attendance_exceptions to authenticated;
create policy attendance_exceptions_select on public.attendance_exceptions for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy attendance_exceptions_insert on public.attendance_exceptions for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy attendance_exceptions_update on public.attendance_exceptions for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
revoke execute on function public.validate_attendance_exception_enrollment() from public, anon, authenticated;
commit;
