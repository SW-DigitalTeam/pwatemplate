# Claude Code instructions for this repository

## Frontend work
Install and use the UI/UX Pro Max skill for all frontend design passes:
```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```
Constraints that override any skill suggestion:
- All colour/typography flows through the CSS variables set by `ProgrammeTheme`
  (`--sw-primary`, `--sw-surface`, etc.). Never hard-code programme colours in components.
- WCAG 2.2 AA is a floor: visible focus, 4.5:1 text contrast, 44px touch targets,
  reduced-motion respected, no colour-only meaning, labels on every control.
- Mobile-first: verify 375px, 768px, 1024px layouts for every screen.
- Participant-centred language; never assume the reader identifies as sporty.

## Non-negotiables
- Access control lives in RLS + server code. Hiding a button is not access control.
- Any schema change = a new migration + updated `supabase/tests/rls_test.sql`
  + `npm run test:db` passing.
- No participant PII in logs, analytics, fixtures, or screenshots.
- Synthetic data only, everywhere except production.
- Editing a published survey creates a new version; never mutate a published definition.
- Do not claim a feature is complete unless the flow is implemented and tested.

## Commands
- `npm run typecheck` · `npm run test` · `npm run test:db` · `npm run build`
