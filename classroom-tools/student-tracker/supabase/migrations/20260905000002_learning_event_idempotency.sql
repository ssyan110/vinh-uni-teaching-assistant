-- Allow the offline randomizer to safely retry a saved oral-response event.
alter table public.learning_events add column client_event_id text;
create unique index learning_events_owner_client_event_key
  on public.learning_events(owner_id, client_event_id)
  where client_event_id is not null;
