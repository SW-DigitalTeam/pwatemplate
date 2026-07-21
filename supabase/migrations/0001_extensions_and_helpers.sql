-- Migration 0001: extensions, enums, helper functions
-- Sport Waikato PWA Platform
-- NOTE: On hosted Supabase the auth schema already exists. Locally, run
-- supabase/tests/local_auth_shim.sql first (test environments only).

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Helper functions below reference tables created in 0002; defer body checks
-- (this matches Supabase CLI migration behaviour).
set check_function_bodies = off;

-- ---------- Enums ----------
create type public.app_role as enum (
  'participant',        -- student / participant
  'caregiver',
  'teacher',            -- teacher or school coordinator
  'facilitator',        -- programme facilitator
  'school_admin',
  'sw_programme_admin', -- Sport Waikato programme administrator
  'sw_reporting',       -- Sport Waikato reporting user
  'system_admin',
  'tech_support'
);

create type public.application_status as enum
  ('pending', 'info_requested', 'approved', 'declined', 'suspended');

create type public.participant_status as enum
  ('invited', 'enrolled', 'active', 'withdrawn', 'completed');

create type public.session_status as enum
  ('scheduled', 'in_progress', 'completed', 'cancelled');

create type public.attendance_status as enum
  ('present', 'absent', 'late', 'left_early');

create type public.measure_source as enum
  ('recorded', 'self_reported', 'facilitator_observed', 'calculated');

create type public.survey_anonymity as enum
  ('identified', 'pseudonymous', 'anonymous');

create type public.survey_status as enum
  ('draft', 'published', 'closed');

create type public.response_status as enum
  ('in_progress', 'submitted');

create type public.issue_category as enum
  ('bug', 'equipment', 'data_quality', 'accessibility', 'safeguarding', 'other');

create type public.issue_severity as enum
  ('low', 'medium', 'high', 'critical');

-- ---------- Role helper functions ----------
-- All authorisation checks live in the database so that RLS, RPC and the
-- application server share one source of truth.

create schema if not exists app;

-- The caller's user id (wraps Supabase auth.uid()).
create or replace function app.current_user_id() returns uuid
language sql stable
as $$ select auth.uid() $$;

-- True if the caller holds a Sport Waikato organisation-level role.
create or replace function app.is_sw_staff() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('sw_programme_admin', 'sw_reporting', 'system_admin', 'tech_support')
      and ur.revoked_at is null
  )
$$;

create or replace function app.is_system_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'system_admin'
      and ur.revoked_at is null
  )
$$;

-- True if the caller holds `wanted_role` scoped to school and/or programme.
-- A NULL school_id / programme_id on the stored role means "all".
create or replace function app.has_role(
  wanted_role public.app_role,
  target_school uuid default null,
  target_programme uuid default null
) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = wanted_role
      and ur.revoked_at is null
      and (ur.school_id is null or target_school is null or ur.school_id = target_school)
      and (ur.programme_id is null or target_programme is null or ur.programme_id = target_programme)
  )
$$;

-- True if the caller has ANY staff-type role at the given school.
create or replace function app.is_school_staff(target_school uuid) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('teacher', 'facilitator', 'school_admin')
      and ur.revoked_at is null
      and ur.school_id = target_school
  )
$$;

comment on function app.has_role is
  'Server-side RBAC check. UI hiding is never an access control; these functions are.';
