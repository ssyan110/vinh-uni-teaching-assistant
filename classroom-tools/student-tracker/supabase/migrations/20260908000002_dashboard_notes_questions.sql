-- Teacher-only factual notes are append-only: corrections preserve prior versions.
create table public.student_notes (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id),
 course_id uuid not null,
 student_id uuid not null,
 note_date date not null,
 category text not null check (category in ('homework_missing','textbook_missing','classroom_rule','other')),
 body text not null check (char_length(trim(body)) between 1 and 2000),
 supersedes_id uuid unique,
 correction_reason text,
 created_at timestamptz not null default now(),
 unique(owner_id,course_id,student_id,id),
 foreign key(owner_id,course_id) references public.courses(owner_id,id),
 foreign key(owner_id,student_id) references public.students(owner_id,id),
 foreign key(course_id,student_id) references public.enrollments(course_id,student_id),
 foreign key(owner_id,course_id,student_id,supersedes_id) references public.student_notes(owner_id,course_id,student_id,id),
 check (supersedes_id is null or char_length(trim(correction_reason)) between 1 and 500),
 check (supersedes_id is null or correction_reason is not null)
);
alter table public.student_notes enable row level security;
revoke all on public.student_notes from anon, authenticated;
grant select, insert on public.student_notes to authenticated;
create policy notes_read on public.student_notes for select to authenticated using(owner_id=auth.uid());
create policy notes_insert on public.student_notes for insert to authenticated with check(owner_id=auth.uid());
create index student_notes_owner_student on public.student_notes(owner_id,student_id,note_date);
alter table public.randomizer_attempts add column question_id text check(question_id is null or char_length(question_id) between 1 and 160);
