-- Independent learning records; classroom source does not determine pool eligibility.
alter table public.class_sessions add constraint sessions_owner_course_id_key unique(owner_id, course_id, id);
alter table public.enrollments add constraint enrollments_owner_course_student_key unique(owner_id, course_id, student_id);

create table public.learning_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  course_id uuid not null,
  session_id uuid not null,
  student_id uuid not null,
  occurred_at timestamptz not null default now(),
  source text not null check(source in ('class_observation','random_call','voluntary_answer')),
  textbook_id text not null check(length(textbook_id) between 1 and 100),
  lesson_id text not null check(lesson_id ~ '^lesson-[0-9]{2}$'),
  lesson_label text not null check(length(lesson_label) between 1 and 200),
  activity_label text not null check(length(activity_label) between 1 and 300),
  rubric_version text not null default 'oral-response-v1',
  task_completion smallint check(task_completion between 0 and 3),
  comprehensibility smallint check(comprehensibility between 0 and 3),
  language_control smallint check(language_control between 0 and 3),
  interaction smallint check(interaction between 0 and 3),
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(owner_id,course_id,session_id) references public.class_sessions(owner_id,course_id,id),
  foreign key(owner_id,course_id,student_id) references public.enrollments(owner_id,course_id,student_id)
);
create index learning_events_course_date on public.learning_events(owner_id,course_id,occurred_at desc);
create trigger learning_events_updated before update on public.learning_events for each row execute function public.set_updated_at();
alter table public.learning_events enable row level security;
revoke all on public.learning_events from anon, authenticated;
grant select, insert, update on public.learning_events to authenticated;
create policy learning_events_read on public.learning_events for select to authenticated using ((select auth.uid())=owner_id);
create policy learning_events_insert on public.learning_events for insert to authenticated with check ((select auth.uid())=owner_id);
create policy learning_events_update on public.learning_events for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
