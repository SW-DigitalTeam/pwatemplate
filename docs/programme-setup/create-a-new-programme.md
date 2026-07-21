# Create a new programme

You do not need to understand the platform internals. A programme is a config.

## 1. Author the config (15–60 min)
```bash
cp packages/programme-config/src/programmes/tap-town.ts \
   packages/programme-config/src/programmes/my-programme.ts
```
Edit: `slug`, `name`, bilingual `description`, `support` (including
safeguarding text — required), `theme` (colours must pass 4.5:1 contrast),
`terminology`, `enabledModules` (the switchboard — start minimal),
`measures` (define YOUR movement measures; there is no universal score),
`consent`, `surveyPacks`, `dataRetention`.

## 2. Register it
Add to `packages/programme-config/src/index.ts`:
```ts
import { myProgramme } from "./programmes/my-programme";
export const programmes = { ...existing, "my-programme": myProgramme } as const;
```
Add the slug to `generateStaticParams` in `apps/web/app/p/[slug]/page.tsx`.

## 3. Validate
```bash
npm run test   # schema validation + safety refinements
npm run build  # page generates at /p/my-programme
```
The schema will refuse: attendance without sessions, surveys without packs,
movement logging without measures, identifiable leaderboards.

## 4. Database row
```sql
insert into public.programmes (slug, name, description, config)
values ('my-programme', 'My Programme', '…', '<config json>');
```
(Backlog #4 adds a sync script that does this from the TypeScript config.)

## 5. Launch checklist
Consent version inserted → survey definitions inserted (if used) → privacy
checklist in docs/privacy completed → school onboarding opened.

## Worked examples
- **Full programme:** `karawhiua.ts` (movement + houses + leaderboards + surveys)
- **Sessions-centric:** `freewheeler.ts`, `gamefit.ts`
- **Registration-only future pilot:** `tap-town.ts` — the pattern for a holiday
  drop-in centre or event registration platform: 5 modules on, everything else off.
