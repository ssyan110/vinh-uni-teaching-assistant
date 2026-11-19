-- A teacher may correct the classroom date and ordinal without touching raw
-- answer events. RLS continues to restrict writes to the row owner.
alter table public.class_sessions
  add column if not exists session_number integer;

alter table public.class_sessions
  add constraint class_sessions_session_number_check
  check (session_number is null or session_number between 1 and 999);

create unique index if not exists class_sessions_course_session_number_key
  on public.class_sessions(course_id, session_number)
  where session_number is not null;
