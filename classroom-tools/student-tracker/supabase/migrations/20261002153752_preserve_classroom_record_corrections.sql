-- Stale randomizer retries must not reactivate a teacher-corrected record.
create or replace function public.keep_corrected_classroom_records_out_of_summary()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.record_status in ('corrected', 'voided') then
    new := old;
  end if;
  if new.record_status in ('corrected', 'voided') then
    new.counted_for_summary := false;
  end if;
  return new;
end;
$$;
