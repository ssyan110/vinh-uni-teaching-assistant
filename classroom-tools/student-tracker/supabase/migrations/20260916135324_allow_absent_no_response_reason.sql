-- Follow-up compatibility migration: the randomizer records an absent student
-- as a no-response reason. Keep the original migration immutable and widen
-- both existing checks for that value.

alter table public.randomizer_attempts
  drop constraint if exists randomizer_attempts_no_response_reason_check;

alter table public.randomizer_attempts
  add constraint randomizer_attempts_no_response_reason_check
  check (no_response_reason is null or no_response_reason in ('unprepared', 'unclear_prompt', 'forgot', 'anxious_unwell', 'time_insufficient', 'chose_skip', 'absent', 'other'));

alter table public.learning_events
  drop constraint if exists learning_events_no_response_reason_check;

alter table public.learning_events
  add constraint learning_events_no_response_reason_check
  check (no_response_reason is null or no_response_reason in ('unprepared', 'unclear_prompt', 'forgot', 'anxious_unwell', 'time_insufficient', 'chose_skip', 'absent', 'other'));
