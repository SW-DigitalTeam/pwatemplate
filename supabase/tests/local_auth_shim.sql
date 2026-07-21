-- TEST/LOCAL ONLY. Never run against a hosted Supabase project.
-- Emulates the Supabase auth schema so migrations and RLS tests can run on
-- plain PostgreSQL. auth.uid() reads a session variable set by the test.
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
-- Emulate Supabase API roles for FORCE RLS testing
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;
grant usage on schema public, app, auth to authenticated;
-- test harness helpers (scratch databases only)
do $$ begin
  if exists (select 1 from pg_namespace where nspname = 'test') then
    grant usage on schema test to authenticated;
    grant execute on all functions in schema test to authenticated;
    grant execute on all procedures in schema test to authenticated;
  end if;
end $$;
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema app to authenticated;
grant execute on all functions in schema auth to authenticated;
