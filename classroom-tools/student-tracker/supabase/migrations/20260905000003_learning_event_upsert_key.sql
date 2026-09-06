drop index if exists public.learning_events_owner_client_event_key;
alter table public.learning_events
  add constraint learning_events_owner_client_event_key unique(owner_id, client_event_id);
