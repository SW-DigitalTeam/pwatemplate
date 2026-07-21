-- Migration 0002: core schema
-- Modular monolith: one database, clear module boundaries by table grouping.
-- Data minimisation: no national student identifiers, no health fields by default.

-- ---------- Identity ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email citext,
  locale text not null default 'en-NZ',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  school_id uuid,          -- FK added after schools table
  programme_id uuid,       -- FK added after programmes table
  granted_by uuid references public.profiles (id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,  -- soft revoke keeps the audit trail intact
  unique (user_id, role, school_id, programme_id)
);

-- ---------- Schools & programmes ----------
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  town text,
  region text default 'Waikato',
  contact_name text,
  contact_email citext,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  description text,
  -- The full ProgrammeConfig (packages/programme-config) is synced here so the
  -- database and app agree on enabled modules, terminology, theme, etc.
  config jsonb not null default '{}'::jsonb,
  config_version int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A school's application/participation in one programme.
create table public.school_programmes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete cascade,
  status public.application_status not null default 'pending',
  intended_participants text,   -- free text from the application
  participant_limit int,
  programme_lead uuid references public.profiles (id),
  internal_notes text,          -- SW staff only (enforced by column-level policy in views)
  terms_agreed_at timestamptz,
  terms_version text,
  applied_by uuid references public.profiles (id),
  decided_by uuid references public.profiles (id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, programme_id)
);

alter table public.user_roles
  add constraint user_roles_school_fk foreign key (school_id) references public.schools (id) on delete cascade,
  add constraint user_roles_programme_fk foreign key (programme_id) references public.programmes (id) on delete cascade;

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  school_programme_id uuid not null references public.school_programmes (id) on delete cascade,
  name text not null,
  kind text not null default 'class' check (kind in ('class', 'house', 'group')),
  created_at timestamptz not null default now(),
  unique (school_programme_id, name)
);

-- ---------- Participants & consent ----------
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  -- Pseudonymous identifier used in analysis exports; never the primary key
  -- of a report a school can't see. Generated, human-readable, no PII.
  pseudonym text not null unique default ('P-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  school_id uuid not null references public.schools (id) on delete restrict,
  display_name text not null,       -- first name / preferred name only
  year_level text,
  user_id uuid references public.profiles (id),  -- null when the participant has no account
  access_method text not null default 'managed'
    check (access_method in ('managed', 'access_code', 'invitation_link', 'caregiver_account', 'google', 'magic_link')),
  accessibility_notes text,         -- optional, participant/caregiver supplied
  status public.participant_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  school_programme_id uuid not null references public.school_programmes (id) on delete cascade,
  cohort_id uuid references public.cohorts (id) on delete set null,
  status public.participant_status not null default 'enrolled',
  started_at date,
  completed_at date,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  unique (participant_id, school_programme_id)
);

create table public.consent_versions (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes (id) on delete cascade,
  version text not null,
  title text not null,
  content_md text not null,
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  unique (programme_id, version)
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete cascade,
  consent_version_id uuid not null references public.consent_versions (id),
  granted_by_user uuid references public.profiles (id),
  granted_by_name text,             -- when the caregiver has no account
  granted_by_relationship text,     -- e.g. 'mother', 'guardian', 'self (16+)'
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  withdrawal_reason text
);

-- ---------- Sessions, attendance, movement ----------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  school_programme_id uuid not null references public.school_programmes (id) on delete cascade,
  cohort_id uuid references public.cohorts (id) on delete set null,
  facilitator_id uuid references public.profiles (id),
  title text,
  session_type text,                -- validated against programme config in app layer
  scheduled_at timestamptz not null,
  duration_minutes int check (duration_minutes between 0 and 1440),
  status public.session_status not null default 'scheduled',
  delivery_notes text,
  -- offline sync: client-generated key makes retried inserts idempotent
  client_key uuid unique,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  status public.attendance_status not null,
  recorded_by uuid references public.profiles (id),
  recorded_at timestamptz not null default now(),
  -- corrections create a new row and point the old one here (audit-safe)
  superseded_by uuid references public.attendance (id),
  client_key uuid unique,
  unique (session_id, participant_id, superseded_by)
);

-- Programme-defined movement measures. No universal activity score:
-- measure_key + unit are defined per programme in ProgrammeConfig and are
-- never aggregated across different keys by the platform.
create table public.movement_entries (
  id uuid primary key default gen_random_uuid(),
  enrolment_id uuid not null references public.enrolments (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  measure_key text not null,        -- e.g. 'active_minutes', 'distance_km', 'rides'
  value numeric not null,
  unit text not null,
  source public.measure_source not null,
  recorded_by uuid references public.profiles (id),
  occurred_on date not null default current_date,
  client_key uuid unique,
  created_at timestamptz not null default now()
);

-- ---------- Surveys ----------
create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes (id) on delete cascade,
  key text not null,                -- e.g. 'baseline', 'endpoint', 'pulse-1'
  title text not null,
  version int not null default 1,
  -- Editing a published survey creates a NEW version row; responses always
  -- reference the exact version they answered. Meaning is never silently changed.
  definition jsonb not null,        -- sections/questions; validated by packages/surveys schema
  anonymity public.survey_anonymity not null default 'pseudonymous',
  status public.survey_status not null default 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  unique (programme_id, key, version)
);

create table public.survey_assignments (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  school_programme_id uuid not null references public.school_programmes (id) on delete cascade,
  cohort_id uuid references public.cohorts (id) on delete cascade,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  assignment_id uuid references public.survey_assignments (id) on delete set null,
  -- Exactly one of these depending on survey anonymity:
  participant_id uuid references public.participants (id) on delete set null, -- identified
  pseudonym text,                                                             -- pseudonymous matching
  anon_token uuid,                                                            -- anonymous (unlinkable)
  respondent_role text not null default 'participant'
    check (respondent_role in ('participant', 'teacher', 'facilitator', 'caregiver', 'school')),
  status public.response_status not null default 'in_progress',
  answers jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  client_key uuid unique,
  check (
    (participant_id is not null)::int + (pseudonym is not null)::int + (anon_token is not null)::int <= 1
  )
);

-- ---------- Issues & audit ----------
create table public.issues (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete set null,
  programme_id uuid references public.programmes (id) on delete set null,
  category public.issue_category not null,
  severity public.issue_severity not null default 'medium',
  title text not null,
  detail text,
  reported_by uuid references public.profiles (id),
  status text not null default 'open' check (status in ('open', 'triaged', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.issues is
  'Safeguarding-category issues are visible only to SW programme admins and system admins (see RLS). They are reviewed by humans; the platform never auto-interprets them.';

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,                        -- null for system actions
  action text not null,              -- e.g. 'school.approve', 'attendance.correct'
  entity text not null,
  entity_id uuid,
  school_id uuid,
  programme_id uuid,
  detail jsonb not null default '{}'::jsonb,  -- never contains survey free text
  created_at timestamptz not null default now()
);
comment on table public.audit_log is 'Append-only. No update/delete policies exist by design.';

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email citext,
  access_code text unique,           -- for participant access without email
  role public.app_role not null,
  school_id uuid references public.schools (id) on delete cascade,
  programme_id uuid references public.programmes (id) on delete cascade,
  invited_by uuid references public.profiles (id),
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'email' check (channel in ('email')),
  to_address citext not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'suppressed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- Time-boxed, audited support access (no silent impersonation).
create table public.support_grants (
  id uuid primary key default gen_random_uuid(),
  support_user uuid not null references public.profiles (id),
  school_id uuid references public.schools (id),
  reason text not null,
  granted_by uuid not null references public.profiles (id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default now() + interval '4 hours',
  revoked_at timestamptz
);

-- ---------- Indexes ----------
create index on public.user_roles (user_id);
create index on public.participants (school_id);
create index on public.enrolments (school_programme_id);
create index on public.sessions (school_programme_id, scheduled_at);
create index on public.attendance (session_id);
create index on public.movement_entries (enrolment_id, measure_key, occurred_on);
create index on public.survey_responses (survey_id, status);
create index on public.audit_log (entity, entity_id);
create index on public.audit_log (created_at);

-- ---------- updated_at maintenance ----------
create or replace function app.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','schools','programmes','school_programmes','participants','sessions','issues']
  loop
    execute format('create trigger touch_%I before update on public.%I for each row execute function app.touch_updated_at()', t, t);
  end loop;
end $$;
