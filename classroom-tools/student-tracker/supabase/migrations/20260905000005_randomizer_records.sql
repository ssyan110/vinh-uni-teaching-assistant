-- Cloud-first classroom randomizer records.
-- The randomizer keeps local state for offline continuity, while Supabase is the
-- durable source for each classroom session and every selection/response state.

create table public.randomizer_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  class_session_id uuid not null,
  course_id uuid not null,
  client_session_id text not null check (char_length(client_session_id) between 1 and 120),
  session_date date not null,
  textbook_id text not null check (char_length(textbook_id) between 1 and 100),
  lesson_id text not null check (lesson_id ~ '^lesson-[0-9]{2}$'),
  scoring_mode text not null check (scoring_mode in ('graded', 'practice')),
  task_mode text not null check (char_length(task_mode) between 1 and 100),
  task_target text not null check (char_length(task_target) between 1 and 100),
  current_round integer not null default 1 check (current_round > 0),
  answered_student_ids text[] not null default '{}',
  excluded_student_ids text[] not null default '{}',
  roster_count integer not null default 0 check (roster_count >= 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint randomizer_sessions_owner_id_key unique (owner_id, id),
  constraint randomizer_sessions_owner_client_key unique (owner_id, client_session_id),
  constraint randomizer_sessions_owner_course_id_key unique (owner_id, course_id, id),
  constraint randomizer_sessions_class_session_fk
    foreign key (owner_id, course_id, class_session_id)
    references public.class_sessions(owner_id, course_id, id) on delete restrict,
  constraint randomizer_sessions_completion_check
    check ((status = 'in_progress' and completed_at is null) or (status = 'completed' and completed_at is not null))
);

create table public.randomizer_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  randomizer_session_id uuid not null,
  course_id uuid not null,
  student_id uuid,
  client_attempt_id text not null check (char_length(client_attempt_id) between 1 and 160),
  student_code text not null check (char_length(student_code) between 1 and 60),
  student_name text not null check (char_length(student_name) between 1 and 100),
  seat_number text,
  round_number integer not null check (round_number > 0),
  selection_method text not null check (selection_method in ('random', 'volunteer')),
  outcome text not null check (outcome in ('pending', 'answered', 'not_answered', 'undone')),
  assessment_status text not null check (assessment_status in ('scored', 'pending', 'not_applicable')),
  textbook_id text not null check (char_length(textbook_id) between 1 and 100),
  lesson_id text not null check (lesson_id ~ '^lesson-[0-9]{2}$'),
  task_mode text not null check (char_length(task_mode) between 1 and 100),
  task_target text not null check (char_length(task_target) between 1 and 100),
  rubric_id text not null check (char_length(rubric_id) between 1 and 100),
  rubric_version text not null check (char_length(rubric_version) between 1 and 40),
  task_completion smallint check (task_completion between 0 and 3),
  comprehensibility smallint check (comprehensibility between 0 and 3),
  language_control_vocabulary smallint check (language_control_vocabulary between 0 and 3),
  content_interaction smallint check (content_interaction between 0 and 3),
  total_score smallint check (total_score between 0 and 12),
  counted_for_grade boolean not null default true,
  note text check (char_length(note) <= 2000),
  drawn_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint randomizer_attempts_owner_id_key unique (owner_id, id),
  constraint randomizer_attempts_owner_client_key unique (owner_id, client_attempt_id),
  constraint randomizer_attempts_session_fk
    foreign key (owner_id, course_id, randomizer_session_id)
    references public.randomizer_sessions(owner_id, course_id, id) on delete restrict,
  constraint randomizer_attempts_student_fk
    foreign key (owner_id, course_id, student_id)
    references public.enrollments(owner_id, course_id, student_id) on delete restrict,
  constraint randomizer_attempts_outcome_status_check
    check (
      (outcome = 'answered' and assessment_status in ('scored', 'pending'))
      or (outcome in ('pending', 'not_answered', 'undone') and assessment_status = 'not_applicable')
    ),
  constraint randomizer_attempts_scores_check
    check (
      (assessment_status = 'scored'
        and task_completion is not null
        and comprehensibility is not null
        and language_control_vocabulary is not null
        and content_interaction is not null
        and total_score is not null)
      or (assessment_status <> 'scored'
        and task_completion is null
        and comprehensibility is null
        and language_control_vocabulary is null
        and content_interaction is null
        and total_score is null)
    ),
  constraint randomizer_attempts_completion_check
    check ((outcome = 'pending' and completed_at is null) or (outcome <> 'pending' and completed_at is not null))
);

create index randomizer_sessions_owner_course_date_idx
  on public.randomizer_sessions(owner_id, course_id, session_date desc);
create index randomizer_attempts_owner_session_round_idx
  on public.randomizer_attempts(owner_id, randomizer_session_id, round_number, drawn_at);
create index randomizer_attempts_owner_course_student_idx
  on public.randomizer_attempts(owner_id, course_id, student_id, drawn_at desc);

create trigger randomizer_sessions_updated
  before update on public.randomizer_sessions
  for each row execute function public.set_updated_at();
create trigger randomizer_attempts_updated
  before update on public.randomizer_attempts
  for each row execute function public.set_updated_at();

alter table public.randomizer_sessions enable row level security;
alter table public.randomizer_attempts enable row level security;

revoke all on public.randomizer_sessions, public.randomizer_attempts from anon, authenticated;
grant select, insert, update, delete on public.randomizer_sessions, public.randomizer_attempts to authenticated;

create policy randomizer_sessions_owner_select
  on public.randomizer_sessions for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy randomizer_sessions_owner_insert
  on public.randomizer_sessions for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy randomizer_sessions_owner_update
  on public.randomizer_sessions for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy randomizer_sessions_owner_delete
  on public.randomizer_sessions for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy randomizer_attempts_owner_select
  on public.randomizer_attempts for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy randomizer_attempts_owner_insert
  on public.randomizer_attempts for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy randomizer_attempts_owner_update
  on public.randomizer_attempts for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy randomizer_attempts_owner_delete
  on public.randomizer_attempts for delete to authenticated
  using ((select auth.uid()) = owner_id);
