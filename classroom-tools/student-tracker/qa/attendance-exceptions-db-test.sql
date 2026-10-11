-- Run ONLY in a fresh disposable local PostgreSQL database, never on Supabase
-- or a database containing real student records. Creates synthetic auth roles.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
\ir ../supabase/migrations/20260823090017_initial_student_tracker.sql
\ir ../supabase/attendance-exceptions.sql

begin;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
insert into public.academic_terms(id,owner_id,name,starts_on,ends_on) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Synthetic term','2026-09-01','2026-12-31');
insert into public.courses(id,owner_id,term_id,code,name) values
 ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','SYNTHETIC','Synthetic class');
insert into public.students(id,owner_id,student_code,chinese_name) values
 ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','SYN001','測試學生'),
 ('30000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','SYN002','未修課測試學生');
insert into public.enrollments(owner_id,course_id,student_id) values
 ('00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
insert into public.class_sessions(id,owner_id,course_id) values
 ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into public.attendance_exceptions(session_id,student_id,observed_status,reason,arrival_time) values
 ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','present','Synthetic QR failure','08:05');
update public.attendance_exceptions set makeup_status='completed',makeup_date='2026-10-01';
do $$ begin
 if (select count(*) from public.attendance_exceptions where official_status='unverified') <> 1 then raise exception 'makeup must not imply verification'; end if;
 begin
  update public.attendance_exceptions set official_status='confirmed';
  raise exception 'verification without date was accepted';
 exception when check_violation then null; end;
 begin
  insert into public.attendance_exceptions(session_id,student_id,observed_status,reason) values
   ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','present','Synthetic wrong enrollment');
  raise exception 'unenrolled student was accepted';
 exception when check_violation then null; end;
 begin
  delete from public.attendance_exceptions;
  raise exception 'delete was allowed';
 exception when insufficient_privilege then null; end;
end $$;
update public.attendance_exceptions set official_status='confirmed',verified_on='2026-10-02';
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$ declare changed integer; begin
 if (select count(*) from public.attendance_exceptions) <> 0 then raise exception 'cross-owner read was allowed'; end if;
 begin
  insert into public.attendance_exceptions(owner_id,session_id,student_id,observed_status,reason) values
   ('00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','present','Synthetic forged owner');
  raise exception 'cross-owner insert was allowed';
 exception when insufficient_privilege or check_violation then null; end;
 update public.attendance_exceptions set reason='Forged';
 get diagnostics changed = row_count;
 if changed <> 0 then raise exception 'cross-owner update was allowed'; end if;
end $$;
reset role;
set role anon;
do $$ begin
 begin perform * from public.attendance_exceptions; raise exception 'anonymous read allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
\echo 'PASS: synthetic create/edit, independent official verification, enrollment, owner isolation, no delete, no anonymous access'
