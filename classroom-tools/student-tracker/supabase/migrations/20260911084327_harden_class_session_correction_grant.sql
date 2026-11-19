revoke all on function public.correct_class_session(uuid, date, integer, text) from anon, public;
grant execute on function public.correct_class_session(uuid, date, integer, text) to authenticated;
