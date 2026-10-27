begin;
do $qa$
declare c uuid := '4ac56f1a-2950-4577-9ce7-0a1887ccecb7'; s uuid := '39ff0ccf-901c-4261-af29-4c4819ccf702';
begin
  perform 1 from public.courses where id=c and code='QA_AUDIT_20261025' and name='Supabase audit — synthetic only' for update;
  if not found then raise exception 'Synthetic fixture identity changed'; end if;
  if not exists(select 1 from public.students where id=s and student_code='QA-AUDIT-20261025')
    or (select count(*) from public.enrollments where course_id=c)<>1
    or exists(select 1 from public.randomizer_sessions where course_id=c)
    or exists(select 1 from public.student_notes where course_id=c)
    or exists(select 1 from public.followups where course_id=c)
    or exists(select 1 from public.learning_events where course_id=c and id<>'0cf93dbc-dc16-4027-9f55-920de9c71d78')
    then raise exception 'Unexpected fixture records; stop cleanup'; end if;
  delete from public.classroom_record_corrections where course_id=c and record_id='0cf93dbc-dc16-4027-9f55-920de9c71d78';
  delete from public.learning_events where course_id=c and id='0cf93dbc-dc16-4027-9f55-920de9c71d78';
  delete from public.attendance_records where session_id='26d66e65-4291-4ea9-93fd-3c291249aded' and student_id=s;
  delete from public.class_sessions where id='26d66e65-4291-4ea9-93fd-3c291249aded' and course_id=c;
  delete from public.enrollments where course_id=c and student_id=s;
  delete from public.students where id=s and student_code='QA-AUDIT-20261025';
  delete from public.courses where id=c and code='QA_AUDIT_20261025';
end $qa$;
commit;
select 'PASS: only exact synthetic audit fixtures removed' result;
