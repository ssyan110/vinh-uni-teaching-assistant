-- The correction RPC is teacher-only. The function still validates auth.uid,
-- but anonymous callers should not receive EXECUTE permission at all.
revoke all on function public.correct_class_session(uuid, date, integer, text) from anon, public;
grant execute on function public.correct_class_session(uuid, date, integer, text) to authenticated;
