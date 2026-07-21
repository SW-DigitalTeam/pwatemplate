# Maintenance runbook

## Severity model & proposed targets (for SW approval — not commitments)
| Sev | Definition | Respond | Resolve target |
|---|---|---|---|
| Critical | Security incident, data loss, app-wide outage | 2 business hours | 1 business day |
| High | Core programme flow unavailable | 1 business day | 3 business days |
| Medium | Degraded, workaround exists | 3 business days | Next release |
| Low | Minor defect/wording/visual | Backlog | As scheduled |

## Triage (weekly, 30 min)
New issues → confirm severity honestly → label → Critical/High get an owner
immediately → close duplicates with links → data-affected issues get a privacy
note.

## Hotfix
branch from `main` → fix + test → PR (CI must pass, incl. RLS suite) →
squash-merge → verify on preview → deploy → note in changelog.

## Rollback
App: Vercel "Redeploy previous". Database: migrations are forward-only —
restore from backup (below) then apply a corrective migration. Never edit an
applied migration file.

## Backups & restoration test (quarterly)
Supabase automated backups (verify schedule per plan). Test: restore latest
backup into a scratch project → run `scripts/test-db.sh` against it → record
date/result in this file's log section.

## Quarterly access review
Export `user_roles` where revoked_at is null → each school confirms staff list
→ revoke leavers (soft revoke keeps audit) → check `support_grants` history →
rotate any long-lived credentials.

## Release checklist
CI green (app + database jobs) → migrations reviewed → known-limitations
updated if scope changed → tag `vX.Y.Z` → release notes from commits →
post-deploy: health endpoint + one smoke flow per active programme.

## Dependency updates
Renovate PRs Monday mornings; patch dev-deps automerge; review the rest within
the week; security-labelled PRs jump the queue.

## Feature-flag hygiene
Quarterly: list `featureFlags` across configs; delete flags fully rolled out
or abandoned.

## Maintenance capacity estimate (for planning)
| Volume | Dev hours/month | Notes |
|---|---|---|
| 1 pilot programme | 8–15 | Triage, updates, small fixes |
| 3 programmes regional | 20–35 | + school support load |
| 5+ programmes | 40–60 | Consider retained agency/second maintainer |
Plus hosting/monitoring costs in ADR-0003. Support effort scales with school
count more than participant count; invest in the school-coordinator guide.

## Monitoring & alerts (setup guide)
- Sentry: frontend + server projects per environment; alert on new issue type
  and >10 events/hour → email SW digital lead; PII scrubbing ON.
- Uptime: external ping of `/api/health` every 5 min (e.g. Better Stack free
  tier); alert after 2 consecutive failures → SW digital lead + maintainer.
- Supabase: database health + auth error dashboards weekly; log retention per plan.
- Operational: weekly query of `notification_outbox` failed rows and stalled
  imports (backlog #6 automates this).
- Analytics (privacy-safe, no PII): registration funnel, onboarding completion,
  session-recording completion, survey completion, repeat use. Aggregate counts only.

## Browser/device support policy
Evergreen Chrome/Edge/Safari/Firefox, iOS/Android current-1, school-managed
iPads (Safari) explicitly in test matrix. No IE.
