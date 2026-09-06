alter table public.learning_events
  add column counted_for_grade boolean not null default true;
