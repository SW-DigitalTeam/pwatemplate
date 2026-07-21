# Known limitations & honest status (v0.1.0)

## Implemented AND tested
- Database schema (21 tables), full RLS with FORCE, append-only audit,
  reporting views — 12 boundary tests passing on PostgreSQL 16 (CI job).
- ProgrammeConfig schema + 4 programme configs (Karawhiua, FreeWheeler,
  GameFIT, Tap Town) — validation + safety-refinement tests passing.
- Next.js app builds: config-driven programme pages (theme/terminology/module
  gating), health endpoint, PWA manifest, service worker (shell caching,
  offline fallback, never caches API/identifiable data), offline indicator.
- CI pipeline definition (typecheck, tests, build, secret scan, migration+RLS
  job) — runs on GitHub once pushed.
- Synthetic seed with demo accounts for every role.

## Scaffolded, NOT complete
- **Auth flows**: Supabase client wiring exists; Google OAuth, magic links,
  access-code redemption, MFA enforcement need a live Supabase project +
  Google Cloud OAuth credentials, then UI + tests. (Backlog #1)
- **Offline write outbox**: client_key idempotency enforced in schema; the
  IndexedDB queue client library is not written. (Backlog #2)
- **School onboarding UI, survey engine UI, dashboards, CSV import/export UI**:
  schema + permissions ready; screens not built. (Backlog #3, #5, #6, #7)
- **Notifications**: outbox table exists; sender Edge Function + templates not
  built. (Backlog #6)
- **i18n plumbing**: bilingual content modelled in config; locale switching in
  the app not implemented. (Backlog #8)

## Not started
- Sentry integration, Vercel project config, staging environment, e2e tests
  (Playwright), accessibility automated testing (axe), config→database sync
  script, data deletion workflows UI.

## Risks stated plainly
- RLS tests run on plain PostgreSQL with an auth shim; before production,
  re-run against a real Supabase project (identical engine, but verify).
- No load testing has occurred. Tap Town-scale write volumes need the ADR-0002
  ingest review first.
- The service worker is deliberately conservative; verify update behaviour on
  school-managed iPads before relying on offline attendance in the field.
