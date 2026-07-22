# Known limitations & honest status (v0.1.0 — updated 22 Jul 2026)

## What's built and TESTED
- **Database**: 21 tables, full RLS with FORCE on every table, append-only audit log, 3 reporting views (v_participation_summary, v_movement_rollup, v_survey_completion), small-group suppression (n=5). 12 RLS boundary tests passing against PostgreSQL 16.
- **Programme config**: 16 toggleable modules, 4 sample configs (Karawhiua, FreeWheeler, GameFIT, Tap Town). Schema-enforced safety rules. Config sync script (`npm run sync:config`).
- **Auth flows**: Google OAuth, magic links, access codes, sign-up/sign-out. Middleware protecting all dashboard routes. All auth pages built and tested.
- **School onboarding**: Full flow (register → admin approve/decline → invite staff → create cohorts).
- **Participant enrolment**: Individual enrolment + bulk CSV import with validation and preview.
- **Caregiver consent**: Per-participant consent with version history, recording, and withdrawal.
- **Session management**: Schedule sessions, record attendance with offline queuing (IndexedDB outbox), delivery notes.
- **Survey engine**: Admin builder with all 9 question types, per-programme surveys, versioning, save-and-resume, assignment to schools/cohorts, response analytics.
- **Reporting**: Participation summary, survey completion, movement rollup. CSV export (participants, survey responses, participation summary, movement data).
- **Issue reporting**: Equipment, bugs, safeguarding concerns with severity levels and RLS-restricted viewing.
- **PWA**: Manifest, service worker (conservative: never caches API/identifiable data), offline page, installable.
- **Offline**: IndexedDB outbox with auto-flush on reconnect, idempotent inserts via client_key, sync status indicator.
- **Staff invitations**: School admin invites teachers/facilitators via email, pending/accepted tracking, revoke.
- **Sentry**: Configured with PII scrubbing, global error handler, setup checklist. Zero code changes needed to enable — add the DSN env var.
- **Standard evaluation pack**: Baseline + endpoint + teacher-observations surveys for all 3 survey-enabled programmes (Karawhiua, FreeWheeler, GameFIT).
- **Tests**: 84 E2E + accessibility + schema + RLS boundary tests passing against live Supabase. 6 config validation tests passing. CI with 3 jobs (app, database, e2e).
- **Documentation**: 3 ADRs, architecture overview, data dictionary, role matrix, privacy design, deployment guide, maintenance runbook, Sentry setup checklist, programme creation guide.
- **GitHub**: 8 issue templates, PR template, SECURITY.md, Renovate config.

## Partial / not yet built
- **Google OAuth live**: UI is built and tested; needs Google Cloud Console credentials configured in Supabase dashboard (see docs/operations/google-oauth-setup.md).
- **Data deletion workflows**: Table schemas support deletion; no UI for participant data correction or account deletion requests.
- **User guides**: Skeleton outlines exist (administrator-guide.md, school-coordinator-guide.md); need full content.
- **Survey conditional questions**: Schema supports JSON sections; no UI for conditional logic yet.
- **Staging environment**: Documented in deployment guide; not provisioned.

## Not started
- Vercel project configuration / preview deployments
- Staging environment provisioned
- Sentry enabled with real DSN
- Mobile/tablet extensive testing on real devices
- Primary colour contrast fully verified across all theme variants on all devices

## Risks
- RLS tests run on plain PostgreSQL with auth shim; before production, re-run against a real Supabase project.
- No load testing has occurred.
- The service worker is deliberately conservative; verify on school-managed iPads before relying on offline attendance in the field.
- Programme primary colours pass WCAG 4.5:1 contrast for white text; verify when custom themes are added by programme authors.
