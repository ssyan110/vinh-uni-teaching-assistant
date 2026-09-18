-- Keep the after-class record intentionally small: two teacher-entered text fields.
alter table public.class_sessions
  add column if not exists class_status text check (char_length(class_status) <= 2000),
  add column if not exists progress_text text check (char_length(progress_text) <= 2000);
