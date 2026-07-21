-- Synthetic seed data. All names, schools and people are fictitious.
-- NEVER load real participant data into development, demo or test environments.

-- Demo auth users (works with local shim; on Supabase create these via the dashboard/CLI)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000a001', 'demo-sysadmin@example.org'),
  ('00000000-0000-0000-0000-00000000a002', 'demo-sw-admin@example.org'),
  ('00000000-0000-0000-0000-00000000a003', 'demo-sw-reporting@example.org'),
  ('00000000-0000-0000-0000-00000000b001', 'demo-teacher-kowhai@example.org'),
  ('00000000-0000-0000-0000-00000000b002', 'demo-schooladmin-kowhai@example.org'),
  ('00000000-0000-0000-0000-00000000c001', 'demo-teacher-rimu@example.org'),
  ('00000000-0000-0000-0000-00000000d001', 'demo-student-kowhai@example.org')
on conflict do nothing;

insert into public.profiles (id, display_name, email) values
  ('00000000-0000-0000-0000-00000000a001', 'Demo System Admin', 'demo-sysadmin@example.org'),
  ('00000000-0000-0000-0000-00000000a002', 'Demo SW Programme Admin', 'demo-sw-admin@example.org'),
  ('00000000-0000-0000-0000-00000000a003', 'Demo SW Reporting', 'demo-sw-reporting@example.org'),
  ('00000000-0000-0000-0000-00000000b001', 'Demo Teacher (Kōwhai)', 'demo-teacher-kowhai@example.org'),
  ('00000000-0000-0000-0000-00000000b002', 'Demo School Admin (Kōwhai)', 'demo-schooladmin-kowhai@example.org'),
  ('00000000-0000-0000-0000-00000000c001', 'Demo Teacher (Rimu)', 'demo-teacher-rimu@example.org'),
  ('00000000-0000-0000-0000-00000000d001', 'Demo Student (Kōwhai)', 'demo-student-kowhai@example.org')
on conflict do nothing;

-- Two fictitious schools
insert into public.schools (id, name, town, status) values
  ('00000000-0000-0000-0000-000000050001', 'Kōwhai College (Synthetic)', 'Hamilton', 'approved'),
  ('00000000-0000-0000-0000-000000050002', 'Rimu High School (Synthetic)', 'Tokoroa', 'approved')
on conflict do nothing;

-- Programmes (configs synced from packages/programme-config at deploy time)
insert into public.programmes (id, slug, name, description) values
  ('00000000-0000-0000-0000-0000000b0001', 'karawhiua', 'Karawhiua', 'Inclusive school movement platform'),
  ('00000000-0000-0000-0000-0000000b0002', 'freewheeler', 'FreeWheeler', 'Indoor smart-bike cycling pilot'),
  ('00000000-0000-0000-0000-0000000b0003', 'gamefit', 'GameFIT', 'Active gaming and VR pilot'),
  ('00000000-0000-0000-0000-0000000b0004', 'tap-town', 'Tap Town', 'Community tap-card movement game')
on conflict do nothing;

-- Roles
insert into public.user_roles (user_id, role, school_id, programme_id) values
  ('00000000-0000-0000-0000-00000000a001', 'system_admin', null, null),
  ('00000000-0000-0000-0000-00000000a002', 'sw_programme_admin', null, null),
  ('00000000-0000-0000-0000-00000000a003', 'sw_reporting', null, null),
  ('00000000-0000-0000-0000-00000000b001', 'teacher', '00000000-0000-0000-0000-000000050001', null),
  ('00000000-0000-0000-0000-00000000b002', 'school_admin', '00000000-0000-0000-0000-000000050001', null),
  ('00000000-0000-0000-0000-00000000c001', 'teacher', '00000000-0000-0000-0000-000000050002', null)
on conflict do nothing;

-- School programme participation
insert into public.school_programmes (id, school_id, programme_id, status, terms_agreed_at, terms_version) values
  ('00000000-0000-0000-0000-000000ab0001', '00000000-0000-0000-0000-000000050001',
   '00000000-0000-0000-0000-0000000b0001', 'approved', now(), 'v1'),
  ('00000000-0000-0000-0000-000000ab0002', '00000000-0000-0000-0000-000000050002',
   '00000000-0000-0000-0000-0000000b0001', 'approved', now(), 'v1')
on conflict do nothing;

insert into public.cohorts (id, school_programme_id, name, kind) values
  ('00000000-0000-0000-0000-0000cc000001', '00000000-0000-0000-0000-000000ab0001', 'Tui House', 'house'),
  ('00000000-0000-0000-0000-0000cc000002', '00000000-0000-0000-0000-000000ab0002', 'Room 12', 'class')
on conflict do nothing;

-- Synthetic participants (first names only; entirely fictitious)
insert into public.participants (id, school_id, display_name, year_level, user_id, access_method, status) values
  ('00000000-0000-0000-0000-0000aa000001', '00000000-0000-0000-0000-000000050001', 'Aroha (synthetic)', 'Y9',
   '00000000-0000-0000-0000-00000000d001', 'access_code', 'active'),
  ('00000000-0000-0000-0000-0000aa000002', '00000000-0000-0000-0000-000000050001', 'Ben (synthetic)', 'Y9', null, 'managed', 'active'),
  ('00000000-0000-0000-0000-0000aa000003', '00000000-0000-0000-0000-000000050002', 'Mia (synthetic)', 'Y10', null, 'managed', 'active')
on conflict do nothing;

insert into public.enrolments (id, participant_id, school_programme_id, cohort_id, status, started_at) values
  ('00000000-0000-0000-0000-0000ee000001', '00000000-0000-0000-0000-0000aa000001',
   '00000000-0000-0000-0000-000000ab0001', '00000000-0000-0000-0000-0000cc000001', 'active', current_date - 30),
  ('00000000-0000-0000-0000-0000ee000002', '00000000-0000-0000-0000-0000aa000002',
   '00000000-0000-0000-0000-000000ab0001', '00000000-0000-0000-0000-0000cc000001', 'active', current_date - 30),
  ('00000000-0000-0000-0000-0000ee000003', '00000000-0000-0000-0000-0000aa000003',
   '00000000-0000-0000-0000-000000ab0002', '00000000-0000-0000-0000-0000cc000002', 'active', current_date - 20)
on conflict do nothing;

-- Consent
insert into public.consent_versions (id, programme_id, version, title, content_md) values
  ('00000000-0000-0000-0000-0000cf000001', '00000000-0000-0000-0000-0000000b0001', 'v1',
   'Karawhiua participation consent', '# Consent\nSynthetic consent text for development.')
on conflict do nothing;

insert into public.consents (participant_id, programme_id, consent_version_id, granted_by_name, granted_by_relationship) values
  ('00000000-0000-0000-0000-0000aa000001', '00000000-0000-0000-0000-0000000b0001',
   '00000000-0000-0000-0000-0000cf000001', 'Synthetic Caregiver', 'mother')
on conflict do nothing;

-- A session with attendance and movement
insert into public.sessions (id, school_programme_id, cohort_id, facilitator_id, title, session_type, scheduled_at, duration_minutes, status) values
  ('00000000-0000-0000-0000-00005e000001', '00000000-0000-0000-0000-000000ab0001',
   '00000000-0000-0000-0000-0000cc000001', '00000000-0000-0000-0000-00000000b001',
   'Lunchtime movement session', 'lunchtime', now() - interval '2 days', 40, 'completed')
on conflict do nothing;

insert into public.attendance (session_id, participant_id, status, recorded_by) values
  ('00000000-0000-0000-0000-00005e000001', '00000000-0000-0000-0000-0000aa000001', 'present', '00000000-0000-0000-0000-00000000b001'),
  ('00000000-0000-0000-0000-00005e000001', '00000000-0000-0000-0000-0000aa000002', 'late', '00000000-0000-0000-0000-00000000b001')
on conflict do nothing;

insert into public.movement_entries (enrolment_id, session_id, measure_key, value, unit, source, recorded_by) values
  ('00000000-0000-0000-0000-0000ee000001', '00000000-0000-0000-0000-00005e000001', 'active_minutes', 35, 'minutes', 'facilitator_observed', '00000000-0000-0000-0000-00000000b001'),
  ('00000000-0000-0000-0000-0000ee000002', '00000000-0000-0000-0000-00005e000001', 'active_minutes', 25, 'minutes', 'facilitator_observed', '00000000-0000-0000-0000-00000000b001')
on conflict do nothing;

-- A published baseline survey (definition matches packages/surveys schema)
insert into public.surveys (id, programme_id, key, title, version, status, anonymity, definition) values
  ('00000000-0000-0000-0000-00005f000001', '00000000-0000-0000-0000-0000000b0001',
   'baseline', 'Karawhiua baseline survey', 1, 'published', 'pseudonymous',
   '{"sections":[{"id":"s1","title":"About moving","questions":[
      {"id":"q1","type":"rating","label":"How much do you enjoy being active?","scale":5,"required":true},
      {"id":"q2","type":"agreement","label":"I feel confident joining in movement at school","required":true},
      {"id":"q3","type":"single_choice","label":"How often were you active last week?","options":["0 days","1-2 days","3-4 days","5+ days"],"required":true},
      {"id":"q4","type":"long_text","label":"Anything that makes it hard to take part?","required":false}
   ]}]}'::jsonb)
on conflict do nothing;
