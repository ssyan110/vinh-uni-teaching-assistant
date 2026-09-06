-- Cover composite foreign keys used by the tracker and learning evidence tables.
create index courses_owner_term_idx on public.courses(owner_id, term_id);
create index enrollments_owner_student_idx on public.enrollments(owner_id, student_id);
create index attendance_owner_student_idx on public.attendance_records(owner_id, student_id);
create index observation_owner_student_idx on public.observation_records(owner_id, student_id);
create index followups_owner_course_idx on public.followups(owner_id, course_id);
create index followups_owner_student_idx on public.followups(owner_id, student_id);
create index followups_owner_session_idx on public.followups(owner_id, session_id);
create index learning_events_owner_course_session_idx on public.learning_events(owner_id, course_id, session_id);
create index learning_events_owner_course_student_idx on public.learning_events(owner_id, course_id, student_id);
