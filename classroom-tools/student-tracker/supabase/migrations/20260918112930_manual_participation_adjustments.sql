-- Quick +/- changes are teacher-owned participation adjustments, not random
-- answers, voluntary speaking, grades, or replacement classroom evidence.
alter table public.learning_events
  drop constraint if exists learning_events_source_check;

alter table public.learning_events
  add constraint learning_events_source_check
  check (source in ('class_observation', 'random_call', 'voluntary_answer', 'manual_adjustment'));

alter table public.learning_events
  alter column textbook_id drop not null,
  alter column lesson_id drop not null,
  alter column lesson_label drop not null;

alter table public.learning_events
  add constraint learning_events_manual_adjustment_context_check
  check (
    source <> 'manual_adjustment'
    or (textbook_id is null and lesson_id is null and lesson_label is null)
  );
