-- Cover the composite foreign keys used when resolving randomizer sessions and attempts.
create index randomizer_sessions_owner_course_class_session_idx
  on public.randomizer_sessions(owner_id, course_id, class_session_id);
create index randomizer_attempts_owner_course_session_idx
  on public.randomizer_attempts(owner_id, course_id, randomizer_session_id);
