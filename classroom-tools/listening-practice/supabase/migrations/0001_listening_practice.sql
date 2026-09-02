-- 华语听练 Huayu Listening Lab
-- BRD v1.0 core schema. Apply only after choosing the school's Auth and
-- student-session policy. Student writes must go through a server-side
-- submission endpoint; answer keys never belong in the public question row.

create schema if not exists private;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  term_id uuid not null references public.academic_terms(id),
  display_name text not null,
  course_code text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  unique (course_id, display_name)
);

create table if not exists public.teacher_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'teacher' check (role in ('teacher', 'assistant', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  student_number text not null,
  display_name text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (organization_id, student_number)
);

create table if not exists public.enrollments (
  student_id uuid not null references public.students(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'inactive')),
  enrolled_at timestamptz not null default now(),
  primary key (student_id, class_id)
);

create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  title text not null,
  student_instruction text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercise_versions (
  id uuid primary key default gen_random_uuid(),
  exercise_set_id uuid not null references public.exercise_sets(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (exercise_set_id, version_number)
);

create table if not exists public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  exercise_version_id uuid not null references public.exercise_versions(id) on delete restrict,
  display_name text,
  storage_path text not null,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exercise_version_id uuid not null references public.exercise_versions(id) on delete restrict,
  question_order integer not null check (question_order > 0),
  question_type text not null check (question_type in ('single_choice', 'multi_choice', 'short_text', 'keywords', 'fill_blank', 'true_false')),
  prompt text not null,
  options jsonb,
  points numeric not null default 0 check (points >= 0),
  grading_mode text not null default 'manual' check (grading_mode in ('automatic', 'manual')),
  created_at timestamptz not null default now(),
  unique (exercise_version_id, question_order)
);

-- This table is deliberately outside the exposed public schema. Do not expose
-- it through the Data API or include it in a student payload.
create table if not exists private.question_answer_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  exact_answer text,
  accepted_answers jsonb,
  teacher_note text,
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  exercise_version_id uuid not null references public.exercise_versions(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  available_from timestamptz,
  available_until timestamptz,
  attempt_policy jsonb not null default '{"allow_retake": true}'::jsonb,
  status text not null default 'active' check (status in ('active', 'closed', 'archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (exercise_version_id, class_id)
);

create table if not exists public.listening_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete restrict,
  exercise_version_id uuid not null references public.exercise_versions(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  student_id uuid references public.students(id) on delete restrict,
  student_number_snapshot text not null,
  attempt_number integer not null check (attempt_number > 0),
  idempotency_key text not null,
  started_at timestamptz,
  submitted_at timestamptz not null default now(),
  grading_status text not null default 'pending' check (grading_status in ('pending', 'auto_completed', 'needs_manual', 'manually_graded', 'mixed')),
  auto_score numeric not null default 0,
  manual_score numeric,
  final_score numeric,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.listening_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.listening_attempts(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  answer text not null default '',
  grading_mode text not null check (grading_mode in ('automatic', 'manual')),
  auto_result boolean,
  teacher_score numeric,
  teacher_feedback text,
  grading_status text not null default 'pending' check (grading_status in ('pending', 'auto_completed', 'needs_manual', 'manually_graded')),
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  organization_id uuid references public.organizations(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_terms_org_status on public.academic_terms (organization_id, status);
create index if not exists idx_courses_term_status on public.courses (term_id, status);
create index if not exists idx_classes_course_status on public.classes (course_id, status);
create index if not exists idx_enrollments_class_status on public.enrollments (class_id, status);
create index if not exists idx_exercise_sets_course_status on public.exercise_sets (course_id, status);
create index if not exists idx_versions_set_status on public.exercise_versions (exercise_set_id, status);
create index if not exists idx_assignments_class_status on public.assignments (class_id, status);
create index if not exists idx_attempts_class_submitted on public.listening_attempts (class_id, submitted_at desc);
create index if not exists idx_attempts_student_submitted on public.listening_attempts (student_number_snapshot, submitted_at desc);
create index if not exists idx_responses_attempt on public.listening_responses (attempt_id);

alter table public.organizations enable row level security;
alter table public.academic_terms enable row level security;
alter table public.courses enable row level security;
alter table public.classes enable row level security;
alter table public.teacher_memberships enable row level security;
alter table public.students enable row level security;
alter table public.enrollments enable row level security;
alter table public.exercise_sets enable row level security;
alter table public.exercise_versions enable row level security;
alter table public.audio_assets enable row level security;
alter table public.questions enable row level security;
alter table public.assignments enable row level security;
alter table public.listening_attempts enable row level security;
alter table public.listening_responses enable row level security;
alter table public.audit_events enable row level security;

-- Teachers can read rows belonging to organizations where they have a
-- membership. Student submission writes are intentionally not granted here;
-- finalize them in a server-side endpoint after deciding the student-session
-- model (pilot open mode vs roster mode).
create policy "teachers read memberships"
  on public.teacher_memberships for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "teachers read organizations"
  on public.organizations for select
  to authenticated
  using (exists (
    select 1 from public.teacher_memberships m
    where m.organization_id = organizations.id and m.user_id = (select auth.uid())
  ));

create policy "teachers read terms"
  on public.academic_terms for select
  to authenticated
  using (exists (
    select 1 from public.teacher_memberships m
    where m.organization_id = academic_terms.organization_id and m.user_id = (select auth.uid())
  ));

create policy "teachers read courses"
  on public.courses for select
  to authenticated
  using (exists (
    select 1 from public.teacher_memberships m
    where m.organization_id = courses.organization_id and m.user_id = (select auth.uid())
  ));

create policy "teachers manage classes"
  on public.classes for all
  to authenticated
  using (exists (
    select 1 from public.teacher_memberships m
    join public.courses c on c.organization_id = m.organization_id
    where c.id = classes.course_id and m.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.teacher_memberships m
    join public.courses c on c.organization_id = m.organization_id
    where c.id = classes.course_id and m.user_id = (select auth.uid())
  ));

create policy "teachers read exercise sets"
  on public.exercise_sets for select
  to authenticated
  using (exists (
    select 1 from public.teacher_memberships m
    join public.courses c on c.id = exercise_sets.course_id
    where m.organization_id = c.organization_id and m.user_id = (select auth.uid())
  ));

-- Do not add broad anon/authenticated policies for questions, answer keys,
-- assignments, attempts, or responses. The student API must return a safe
-- projection and accept submissions through a narrowly scoped backend path.
-- Before production, add complete teacher policies for all management tables,
-- run Supabase advisors, and test every RLS path with real Auth identities.
