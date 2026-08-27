create table public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_terms_date_order check (ends_on >= starts_on),
  constraint academic_terms_owner_name_key unique (owner_id, name),
  constraint academic_terms_owner_id_key unique (owner_id, id)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  term_id uuid not null,
  code text not null check (char_length(code) between 1 and 40),
  name text not null check (char_length(name) between 1 and 120),
  room text check (char_length(room) <= 80),
  schedule_text text check (char_length(schedule_text) <= 160),
  attendance_mode text not null default 'exceptions' check (attendance_mode in ('off', 'exceptions', 'confirm_all')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_owner_code_key unique (owner_id, code),
  constraint courses_owner_id_key unique (owner_id, id),
  constraint courses_term_owner_fk foreign key (owner_id, term_id) references public.academic_terms(owner_id, id) on delete cascade
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  student_code text not null check (char_length(student_code) between 1 and 60),
  chinese_name text not null check (char_length(chinese_name) between 1 and 100),
  original_name text check (char_length(original_name) <= 160),
  preferred_name text check (char_length(preferred_name) <= 100),
  status text not null default 'active' check (status in ('active', 'withdrawn', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_owner_code_key unique (owner_id, student_code),
  constraint students_owner_id_key unique (owner_id, id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null,
  student_id uuid not null,
  seat_number integer check (seat_number is null or seat_number > 0),
  status text not null default 'active' check (status in ('active', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollments_course_student_key unique (course_id, student_id),
  constraint enrollments_owner_id_key unique (owner_id, id),
  constraint enrollments_course_owner_fk foreign key (owner_id, course_id) references public.courses(owner_id, id) on delete cascade,
  constraint enrollments_student_owner_fk foreign key (owner_id, student_id) references public.students(owner_id, id) on delete cascade
);

create table public.class_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null,
  session_date date not null default current_date,
  starts_at time,
  topic text check (char_length(topic) <= 200),
  observation_target text check (char_length(observation_target) <= 300),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  what_worked text check (char_length(what_worked) <= 2000),
  common_difficulty text check (char_length(common_difficulty) <= 2000),
  next_adjustment text check (char_length(next_adjustment) <= 2000),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_sessions_owner_id_key unique (owner_id, id),
  constraint class_sessions_course_owner_fk foreign key (owner_id, course_id) references public.courses(owner_id, id) on delete cascade
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null,
  student_id uuid not null,
  status text not null check (status in ('present', 'late', 'absent', 'excused')),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_session_student_key unique (session_id, student_id),
  constraint attendance_session_owner_fk foreign key (owner_id, session_id) references public.class_sessions(owner_id, id) on delete cascade,
  constraint attendance_student_owner_fk foreign key (owner_id, student_id) references public.students(owner_id, id) on delete cascade
);

create table public.observation_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null,
  student_id uuid not null,
  result text not null check (result in ('independent', 'with_prompt', 'not_yet')),
  note text check (char_length(note) <= 1000),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint observation_session_student_key unique (session_id, student_id),
  constraint observation_session_owner_fk foreign key (owner_id, session_id) references public.class_sessions(owner_id, id) on delete cascade,
  constraint observation_student_owner_fk foreign key (owner_id, student_id) references public.students(owner_id, id) on delete cascade
);

create table public.followups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  course_id uuid not null,
  student_id uuid,
  session_id uuid,
  kind text not null check (kind in ('reobserve', 'remind', 'makeup')),
  title text not null check (char_length(title) between 1 and 300),
  due_on date,
  status text not null default 'open' check (status in ('open', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint followups_course_owner_fk foreign key (owner_id, course_id) references public.courses(owner_id, id) on delete cascade,
  constraint followups_student_owner_fk foreign key (owner_id, student_id) references public.students(owner_id, id) on delete cascade,
  constraint followups_session_owner_fk foreign key (owner_id, session_id) references public.class_sessions(owner_id, id) on delete cascade
);

create index courses_owner_idx on public.courses(owner_id);
create index courses_term_idx on public.courses(term_id);
create index students_owner_name_idx on public.students(owner_id, chinese_name);
create index enrollments_owner_idx on public.enrollments(owner_id);
create index enrollments_student_idx on public.enrollments(student_id);
create index class_sessions_owner_course_date_idx on public.class_sessions(owner_id, course_id, session_date desc);
create unique index class_sessions_one_active_course_idx on public.class_sessions(course_id) where status = 'in_progress';
create index attendance_owner_session_idx on public.attendance_records(owner_id, session_id);
create index attendance_student_idx on public.attendance_records(student_id);
create index observations_owner_session_idx on public.observation_records(owner_id, session_id);
create index observations_student_date_idx on public.observation_records(student_id, observed_at desc);
create index followups_owner_status_due_idx on public.followups(owner_id, status, due_on);
create index followups_student_idx on public.followups(student_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger academic_terms_set_updated_at before update on public.academic_terms for each row execute function public.set_updated_at();
create trigger courses_set_updated_at before update on public.courses for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();
create trigger enrollments_set_updated_at before update on public.enrollments for each row execute function public.set_updated_at();
create trigger class_sessions_set_updated_at before update on public.class_sessions for each row execute function public.set_updated_at();
create trigger attendance_records_set_updated_at before update on public.attendance_records for each row execute function public.set_updated_at();
create trigger observation_records_set_updated_at before update on public.observation_records for each row execute function public.set_updated_at();
create trigger followups_set_updated_at before update on public.followups for each row execute function public.set_updated_at();

alter table public.academic_terms enable row level security;
alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.class_sessions enable row level security;
alter table public.attendance_records enable row level security;
alter table public.observation_records enable row level security;
alter table public.followups enable row level security;

create policy "academic_terms_owner_select" on public.academic_terms for select to authenticated using ((select auth.uid()) = owner_id);
create policy "academic_terms_owner_insert" on public.academic_terms for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "academic_terms_owner_update" on public.academic_terms for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "academic_terms_owner_delete" on public.academic_terms for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "courses_owner_select" on public.courses for select to authenticated using ((select auth.uid()) = owner_id);
create policy "courses_owner_insert" on public.courses for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "courses_owner_update" on public.courses for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "courses_owner_delete" on public.courses for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "students_owner_select" on public.students for select to authenticated using ((select auth.uid()) = owner_id);
create policy "students_owner_insert" on public.students for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "students_owner_update" on public.students for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "students_owner_delete" on public.students for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "enrollments_owner_select" on public.enrollments for select to authenticated using ((select auth.uid()) = owner_id);
create policy "enrollments_owner_insert" on public.enrollments for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "enrollments_owner_update" on public.enrollments for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "enrollments_owner_delete" on public.enrollments for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "class_sessions_owner_select" on public.class_sessions for select to authenticated using ((select auth.uid()) = owner_id);
create policy "class_sessions_owner_insert" on public.class_sessions for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "class_sessions_owner_update" on public.class_sessions for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "class_sessions_owner_delete" on public.class_sessions for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "attendance_owner_select" on public.attendance_records for select to authenticated using ((select auth.uid()) = owner_id);
create policy "attendance_owner_insert" on public.attendance_records for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "attendance_owner_update" on public.attendance_records for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "attendance_owner_delete" on public.attendance_records for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "observations_owner_select" on public.observation_records for select to authenticated using ((select auth.uid()) = owner_id);
create policy "observations_owner_insert" on public.observation_records for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "observations_owner_update" on public.observation_records for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "observations_owner_delete" on public.observation_records for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "followups_owner_select" on public.followups for select to authenticated using ((select auth.uid()) = owner_id);
create policy "followups_owner_insert" on public.followups for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "followups_owner_update" on public.followups for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "followups_owner_delete" on public.followups for delete to authenticated using ((select auth.uid()) = owner_id);

revoke all on table public.academic_terms, public.courses, public.students, public.enrollments, public.class_sessions, public.attendance_records, public.observation_records, public.followups from anon;
grant select, insert, update, delete on table public.academic_terms, public.courses, public.students, public.enrollments, public.class_sessions, public.attendance_records, public.observation_records, public.followups to authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
