# Product backlog (next 10) & 12-month roadmap

## Next 10 priorities
1. Auth end-to-end: Google OAuth (staff), magic link, school access codes,
   MFA for privileged roles, session expiry — with Playwright tests.
2. Offline outbox client library (IndexedDB queue, client_key idempotent sync,
   conflict reporting UI) for attendance + notes + issues.
3. School onboarding UI (apply → review → approve/decline/info-requested →
   invite staff → cohorts) over the existing workflow schema.
4. Config→database sync script (`npm run sync:config`) + programme asset upload.
5. Survey engine UI: render definition jsonb, save/resume, conditional
   questions, versioned publishing, assignment + reminders.
6. Notification sender Edge Function (outbox → Resend) + failure monitoring.
7. Dashboards: school view + SW view with filters, small-group suppression,
   CSV export with report metadata.
8. i18n plumbing (en/mi locale switch reading BilingualText).
9. CSV participant import with validation/preview/duplicate detection
   (Airtable/Softr migration path).
10. Sentry + uptime monitoring wired per environment; safe test event verified.

## 12-month roadmap
- **Q1 (now):** Backlog 1–4; deploy staging; first programme configured live
  (recommendation: Tap Town registration mode or Karawhiua next cohort).
- **Q2:** Backlog 5–7; first real pilot on-platform end-to-end; privacy sign-off;
  baseline→endpoint reporting proven with synthetic then real (consented) data.
- **Q3:** Backlog 8–10; second programme onboarded purely by configuration —
  the reusability test; quarterly access review + backup restore test cadence begins.
- **Q4:** Hardening: load review for high-write pilots, accessibility audit
  against WCAG 2.2 AA with disabled users involved, evaluate multi-org demand
  (ADR-0002 trigger), v1.0 tag.
