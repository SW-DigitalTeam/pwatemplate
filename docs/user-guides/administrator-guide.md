# Sport Waikato administrator guide

This guide covers everything a Sport Waikato programme administrator or system administrator needs to operate the platform.

---

## 1. Getting started

Sign in at the deployed URL using Google (for Sport Waikato staff) or an email magic link. After first sign-in, a system administrator must grant your role. Contact the SW Digital Lead if you cannot access the platform.

Once signed in, the **Dashboard** shows all active programmes, quick actions, and navigation links.

---

## 2. Reviewing and approving school applications

Schools apply through the platform self-service. You will see pending applications on your Dashboard or at `/admin/schools`.

**To review an application:**
1. Go to **Admin** → **Schools**
2. Click **Review** on a pending application
3. View the school's details, intended participant group, and selected programmes
4. Use **Approve**, **Decline**, or **Request more info**

Approval adds the school to the platform. Approving also updates all associated school_programme rows — the school can then create cohorts, enrol participants, and start running sessions.

Internal notes are visible only to SW staff and are never shown to schools.

---

## 3. Programme configuration and module activation

Each programme has a configuration that defines what features are available. Configs are maintained in TypeScript (`packages/programme-config/src/programmes/`) and synced to the database.

**To update a programme's modules:**
1. Edit the programme's TypeScript config file
2. Run `npm run sync:config`
3. The database `programmes.config` column updates automatically
4. Deploy the app (Next.js reads configs from the package at build time)

**The 16 modules (toggle on/off per programme):**

| Module | What it does |
|---|---|
| `school_onboarding` | School signup and approval flow |
| `registration` | Participant/whānau self-registration |
| `enrolment` | School-managed participant enrolment |
| `consent` | Caregiver consent tracking |
| `cohorts` | Create classes, houses, groups |
| `sessions` | Schedule and run sessions |
| `attendance` | Record who participated |
| `movement_logging` | Log per-programme movement measures |
| `surveys` | Baseline, midpoint, endpoint surveys |
| `challenges` | Programme challenges |
| `badges` | Achievement badges |
| `leaderboards` | Participation leaderboards (de-identified enforced) |
| `reporting` | Dashboard and reporting views |
| `exports` | CSV data export |
| `notifications` | Email notifications |
| `issue_reporting` | Equipment, technical, safeguarding reporting |

Modules not listed in `enabledModules` are OFF — their UI screens don't render.

---

## 4. Managing roles and the quarterly access review

Roles are assigned via the `user_roles` table. A user can have different roles at different schools or programmes.

**To grant a role:** use the Supabase dashboard SQL editor or the staff invitation system. School admins can invite teachers and facilitators from their school dashboard.

**Quarterly access review (required):**
1. Export current roles: `SELECT * FROM user_roles WHERE revoked_at IS NULL`
2. Send each school a list of their staff
3. Schools confirm current staff — revoke any leavers
4. Revoke is a soft update (`revoked_at = now()`) — audit trail preserved
5. Check support_grants history for any extended access

---

## 5. Authoring and versioning surveys

Surveys are managed at `/admin/surveys`.

**To create a survey:**
1. Click **Create survey**
2. Select the programme and set title, key (e.g. "baseline"), and anonymity level
3. Add sections and questions using the visual builder
4. Publish when ready

**Question types available:**
- Single choice, multiple choice
- Rating scale (1–5)
- Agreement scale (Strongly disagree to Strongly agree)
- Number, date
- Short text, long text
- Yes / No

**Versioning:**
- Editing a published survey creates a **new version** (old version closes)
- Existing responses reference the exact version they answered
- Meaning is never silently changed — this is enforced by versioning

**Assignment:**
- Click **Assign** on a survey
- Select a school and optionally a cohort
- Optionally set a due date
- Surveys appear on participant dashboards when assigned

---

## 6. Viewing responses and reporting

**Survey responses:**
- Go to `/admin/surveys` → click **Responses** on any survey
- View per-question analytics: rating averages, distribution charts, free-text responses
- Export responses as CSV at `/exports`

**Participation reporting:**
- Go to `/reports` for the summary dashboard
- View schools, participants, survey completion, movement data
- Export any view as CSV

**Data dictionary:** See `docs/operations/data-dictionary.md` for definitions of registered, active, retained, and completed participants. Small-group suppression (n < 5) is enforced.

---

## 7. Safeguarding issue handling

Issues with category 'safeguarding' have restricted visibility:
- Only `sw_programme_admin` and `system_admin` can read them
- The person who reports a safeguarding issue cannot read it back (prevents self-review)
- This is enforced at the database level (RLS), not just in the UI

**Process:**
1. Review safeguarding issues in the admin dashboard
2. Follow Sport Waikato's internal safeguarding policy
3. Do NOT use automated interpretation — every safeguarding concern requires human review
4. Record actions in the audit log

---

## 8. Support access (time-boxed grants)

For technical support, use the `support_grants` table:
- Explicit time limit (default 4 hours)
- Recorded in the audit log
- No silent or unaudited impersonation exists in the platform

The `tech_support` role provides time-limited access to school data for debugging. This access is always:
- Explicitly granted
- Time-limited
- Recorded
- Terminable (revoke at any time)

---

## 9. Data exports

Go to `/exports` to download:
- **Participants CSV**: pseudonym, display name, year level, status, school, enrolment info
- **Survey responses CSV**: all submitted responses with pseudonym matching
- **Participation summary CSV**: aggregated counts by programme and school
- **Movement data CSV**: aggregated movement entries by programme, measure, and week

---

## 10. CSV import (migrating from Airtable/Softr)

Go to `/import` to bulk-import participants:
1. Select the target school
2. Upload a CSV file with a header row
3. Preview the first 10 rows
4. Map columns to database fields (display_name, year_level, accessibility_notes)
5. Start import
6. Review the results: X imported, Y errors with per-row error messages

---

## 11. Offline attendance

When recording attendance at a school with unreliable internet:
1. The attendance page shows an **Online / Offline** indicator
2. When offline, clicking **Save** queues records in the browser's IndexedDB
3. Records sync automatically when the connection returns
4. A queue badge shows how many records are waiting
5. Duplicate records are prevented by `client_key` uniqueness

---

## 12. Privacy and deletion requests

Participants can submit privacy requests via the platform. Go to **Admin → Privacy** to:
- View pending requests (deletion, access, correction, withdrawal)
- Review the process checklist
- Search for participants to view their data
- Process requests according to the Privacy Act 2020 (20 working day response)

---

## 13. Deployment and monitoring

- **Deployment**: Push to `main` triggers CI + Vercel deploy. See `docs/operations/deployment.md`.
- **Migrations**: Apply via Supabase CLI or Management API. Forward-only.
- **Backups**: Supabase automated backups. Quarterly restoration test required.
- **Monitoring**: Sentry (front-end + server errors), uptime check on `/api/health`.
- **Sentry setup**: See `docs/operations/sentry-setup-checklist.md`.

---

## 14. Getting help

- **Technical issues**: Report via GitHub Issues using the `bug_report` or `school_support` template
- **Security concerns**: Use the `security_concern` template or contact the SW Digital Lead directly
- **Privacy enquiries**: See `docs/privacy/privacy-security-design.md`
- **Maintenance schedule**: See `docs/operations/maintenance-runbook.md`
