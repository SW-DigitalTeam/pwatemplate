# Privacy & security design (pre-production requirement)

Complete and sign off this document with Sport Waikato privacy/legal review
BEFORE any real participant data enters the system.

## Data inventory
| Data | Where | Why (minimisation) | Retention (config default) |
|---|---|---|---|
| Staff name, email | profiles | Account operation | Life of account |
| Participant first/preferred name, year level | participants | Delivery + school reporting | 24 months post-completion |
| Pseudonym | participants | De-identified analysis & pre/post matching | With participant record |
| Caregiver consent (name, relationship, version, timestamps) | consents | Legal basis for participation | 7 years |
| Attendance, movement entries | attendance, movement_entries | Programme evaluation | 36 months |
| Survey responses | survey_responses | Evaluation | 36 months |
| Audit log | audit_log | Accountability | 84 months |
**Not collected by default:** national student identifiers, health information,
dates of birth, home addresses, photos. Adding any of these requires a config
change plus privacy review.

## Data flow (summary)
Browser (anon key, RLS-scoped) → Supabase PostgREST → PostgreSQL (Sydney).
Edge Functions (service secrets) → Resend for email. Error events → Sentry with
PII scrubbing ON and no survey text ever attached. No advertising trackers.

## Threat model (top risks & mitigations)
1. **Cross-school data exposure** → RLS with FORCE + automated boundary tests
   (rls_test.sql tests both directions).
2. **Reporting re-identification** → sw_reporting blocked from identifiable
   rows (tested); small-group suppression threshold n=5 (`app.small_group_threshold`).
3. **Stolen staff account** → Google sign-in + MFA required for privileged
   roles (enable in Supabase Auth settings), session expiry, audit of role grants.
4. **Secrets leakage** → gitleaks in CI; service-role key only in function
   secrets; env validation refuses placeholder values in production.
5. **Offline device left logged in (shared devices)** → short session TTL on
   participant sessions, visible sign-out, no identifiable data cached by SW.
6. **Safeguarding disclosure in free text** → restricted issue category +
   documented human review path (never automated interpretation); survey
   free-text access limited to sw_programme_admin.

## Breach & incident response
Detect → contain (revoke keys/sessions) → assess scope via audit_log →
notify Sport Waikato leadership same day → if serious harm likely, notify
OPC (NotifyUs) and affected schools/whānau → incident review issue (template)
within 5 working days. Practise annually.

## Māori data governance
Treat participation data about tamariki and rangatahi Māori as taonga.
Principles applied: minimisation, purpose limitation, school/community access
to their own data, aggregate-only external sharing. Before pilots involving
iwi/hapū knowledge or place-based data, engage partners on ownership and
retention; note residency (ADR-0003) explicitly in those conversations.

## Privacy checklist (per programme launch)
- [ ] Config's registrationFields each state a purpose
- [ ] Consent version drafted, plain language, bilingual where appropriate
- [ ] Retention values reviewed for this programme
- [ ] School privacy statement updated & linked
- [ ] Survey pack contains no health-diagnostic items
- [ ] Safeguarding review path staffed (named humans)
- [ ] Sentry PII scrubbing verified in this environment
- [ ] SW privacy/legal sign-off recorded
