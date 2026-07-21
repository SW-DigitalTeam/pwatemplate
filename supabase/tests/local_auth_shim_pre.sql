-- TEST/LOCAL ONLY: minimal auth schema so migrations referencing auth.uid()
-- apply on plain PostgreSQL. Full shim (roles/grants) runs after migrations.
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
