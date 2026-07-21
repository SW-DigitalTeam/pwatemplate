# Architecture overview

## Shape: modular monolith
One Next.js application and one PostgreSQL database (Supabase). Modules
(onboarding, enrolment, consent, sessions, surveys, reporting…) are boundaries
in code and configuration, not separate services. Rationale in ADR-0002.

## Layers
1. **Database (source of truth for authorisation).** All tables carry RLS with
   FORCE. Helper functions in schema `app` implement RBAC; views provide
   de-identified aggregates; audit triggers record privileged transitions.
2. **Next.js app.** Server components + route handlers using the Supabase anon
   key; the service-role key never enters this tier. Programme identity is
   injected from `ProgrammeConfig` (theme variables, terminology, module gating).
3. **Background work.** Notification outbox, CSV import processing and scheduled
   jobs run as Supabase Edge Functions with function-scoped secrets (pattern
   proven in the Carlson Properties email system; not yet implemented here —
   see known-limitations).

## Programme configuration flow
`packages/programme-config` is the authoring surface (typed, validated, tested).
At deploy time each config is synced into `programmes.config` (jsonb) so
database-adjacent logic and external tools read the same truth. The app
re-validates configs at the boundary on every read (`getProgramme`).

## Offline model
- Service worker caches the app shell and static assets only; API data and
  anything identifiable is never cached.
- Offline WRITES (attendance, notes, check-ins, short surveys, issues) queue in
  an IndexedDB outbox keyed by a client-generated `client_key` UUID. The
  database enforces `client_key` uniqueness, so retries are idempotent and
  duplicates are impossible by construction. (Outbox implementation is
  scaffolded in schema; the client library is backlog item #2.)

## Environments
local → preview (Vercel per-PR) → staging → production, each with its own
Supabase project and monitoring. Promotion of migrations is forward-only;
rollback is restore-from-backup plus a corrective migration (runbook).
