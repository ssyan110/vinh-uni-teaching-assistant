-- Disposable local database only.
insert into auth.users values('00000000-0000-0000-0000-000000000001');
insert into public.academic_terms(id,owner_id,name,starts_on,ends_on)
 values('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Synthetic','2026-01-01','2026-12-31');
insert into public.courses(owner_id,term_id,code,name)
 values('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','LOCAL','Synthetic');
