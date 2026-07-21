# Sport Waikato PWA Platform

A reusable, configuration-driven Progressive Web App foundation for Sport Waikato's
digital innovation programmes (GameFIT, FreeWheeler, Karawhiua, Tap Town, and
programmes not yet designed).

**North star:** the platform exists to learn whether a programme is getting more
people moving. Digital engagement alone is never the success measure.

## What this is

- A **modular monolith**: one Next.js app + one Supabase/PostgreSQL database, with
  clear module boundaries and a per-programme on/off switchboard.
- **Configuration over code**: a new programme is a `ProgrammeConfig` file
  (theme, terminology, bilingual labels, modules, measures, consent, surveys),
  not a fork.
- **Security at the database**: every table has row-level security; school
  isolation, reporting de-identification and append-only auditing are enforced
  in PostgreSQL and covered by automated boundary tests.

## Quick start

```bash
bash scripts/setup-local.sh        # install, test, build
cp .env.example apps/web/.env.local  # point at your Supabase dev project
npm run dev
```

Requires Node 22+. Database boundary tests (`npm run test:db`) require local
PostgreSQL 16 or run automatically in CI.

## Repository map

```
apps/web/                  Next.js 15 app (App Router, strict TS, Tailwind)
packages/programme-config/ ProgrammeConfig schema + shipped programme configs
supabase/migrations/       Ordered SQL migrations (schema, RLS, views, audit)
supabase/seed/             Synthetic-only seed data (demo accounts per role)
supabase/tests/            RLS boundary test suite + local auth shim
scripts/                   test-db.sh, setup-local.sh
docs/                      Architecture, privacy, operations, programme setup
.github/                   CI, issue templates (8), PR template
```

## Creating a new programme

See `docs/programme-setup/create-a-new-programme.md`. Short version: copy a
config in `packages/programme-config/src/programmes/`, change the slug, theme,
terminology and module list, register it in `index.ts`, insert the programme
row, done — authentication, RLS, surveys, reporting and monitoring are shared.

## Honest status

This is a foundation at v0.1.0, not a finished product. `docs/known-limitations.md`
lists exactly what is implemented, what is scaffolded, and what is not started.
Do not deploy with real participant data before completing the privacy checklist
in `docs/privacy/`.

## Tooling notes

- Frontend design passes use the **UI/UX Pro Max** Claude Code skill — see `CLAUDE.md`.
- Dependency updates: Renovate (`renovate.json`).
- CI: `.github/workflows/ci.yml` runs typecheck, tests, build, secret scan, and
  the full migration + RLS suite against PostgreSQL 16.
