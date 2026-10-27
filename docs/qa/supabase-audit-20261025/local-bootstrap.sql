-- Only for a disposable local database. Never run on production.
do $$ declare r text; begin
  foreach r in array array['anon','authenticated','service_role','postgres'] loop
    if not exists(select 1 from pg_roles where rolname=r) then
      execute format('create role %I',r);
    end if;
  end loop;
end $$;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth,public to authenticated,anon,service_role;
grant execute on function auth.uid() to authenticated,anon,service_role;
alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
