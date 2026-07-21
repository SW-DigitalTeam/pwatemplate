# ADR-0001: Reference stack

**Status:** accepted · **Date:** 2026-07

## Decision
Next.js 15 + React 19 + strict TypeScript; Tailwind CSS with CSS-variable
theming; Supabase (PostgreSQL 16, Auth, Storage, RLS); Vercel hosting; GitHub
Actions CI; npm workspaces monorepo.

## Why
- Matches Sport Waikato's existing operational stack (GitHub + Supabase +
  Vercel) and the team's established delivery experience across Karawhiua,
  FreeWheeler and Survive the Reap — lowest handover risk of any option.
- Supabase RLS lets authorisation live in the database, satisfying the
  "server and database, not UI" requirement with one mechanism that PostgREST,
  Edge Functions and the app all share.
- Next.js App Router gives server-rendered, low-JS pages appropriate for
  school networks and shared devices, plus first-class PWA primitives.
- Brief assessment of alternatives: Remix/SvelteKit (fine, but no team
  familiarity advantage), separate NestJS API (violates modular-monolith
  principle at this scale), Firebase (weaker relational/reporting story, worse
  data portability).

## Versions
Current stable releases selected at build time and pinned in `package-lock.json`
(committed). The planning docs deliberately avoid hard-coded versions.

## Consequences
Vendor dependencies and exit options are recorded in ADR-0003.
