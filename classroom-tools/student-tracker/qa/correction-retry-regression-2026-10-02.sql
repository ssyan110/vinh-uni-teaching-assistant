-- Run as a transaction; all attempted changes are rolled back.
begin;
do $$
declare original public.randomizer_attempts%rowtype; actual public.randomizer_attempts%rowtype;
begin
  select * into strict original from public.randomizer_attempts
    where record_status='corrected' order by id limit 1 for update;
  update public.randomizer_attempts set record_status='valid', counted_for_summary=true,
    correction_note=null, corrected_at=null where id=original.id;
  select * into strict actual from public.randomizer_attempts where id=original.id;
  if actual.record_status <> 'corrected' or actual.counted_for_summary
    or actual.correction_note is distinct from original.correction_note
    or actual.corrected_at is distinct from original.corrected_at then
    raise exception 'Stale retry restored a corrected classroom record';
  end if;
end $$;
rollback;
