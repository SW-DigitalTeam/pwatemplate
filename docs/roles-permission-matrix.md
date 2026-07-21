# Role and permission matrix

Enforced in `supabase/migrations/0003_rls_policies.sql` and verified by
`supabase/tests/rls_test.sql`. ✔ = allowed, ○ = own/scoped only, — = denied.

| Capability | Participant | Caregiver | Teacher | Facilitator | School admin | SW prog admin | SW reporting | System admin | Tech support |
|---|---|---|---|---|---|---|---|---|---|
| View own profile/record | ○ | ○ | ○ | ○ | ○ | ✔ | — | ✔ | ○ |
| View participants (own school) | own row | linked | ✔ | ✔ | ✔ | ✔ | **—** | ✔ | grant-only |
| View participants (other school) | — | — | **—** | **—** | **—** | ✔ | — | ✔ | — |
| Create/edit participants | — | — | ✔ | ✔ | ✔ | ✔ | — | ✔ | — |
| Apply for programme | — | — | — | — | ✔ | ✔ | — | ✔ | — |
| Approve/decline school application | — | — | — | — | — | ✔ | — | ✔ | — |
| Manage cohorts | — | — | ✔ | ✔ | ✔ | ✔ | — | ✔ | — |
| Record attendance / sessions | — | — | ✔ | ✔ | ✔ | ✔ | — | ✔ | — |
| Correct attendance (supersede) | — | — | ✔ | ✔ | ✔ | ✔ | — | ✔ | — |
| Log movement (self-reported) | ○ | — | — | — | — | — | — | — | — |
| Grant consent | ○ (16+) | ○ | — | — | — | — | — | — | — |
| Author/publish surveys | — | — | — | — | — | ✔ | — | ✔ | — |
| Answer assigned surveys | ○ | ○ | ○ | ○ | ○ | — | — | — | — |
| Read survey responses (rows) | own | own | — | — | — | ✔ | ✔¹ | ✔ | — |
| Read aggregates/dashboards | — | — | school | school | school | ✔ | ✔ | ✔ | — |
| Read safeguarding issues | — | — | — | — | — | ✔ | — | ✔ | — |
| Grant roles | — | — | — | — | school roles² | ✔ | — | ✔ | — |
| Read audit log | — | — | — | — | — | ✔ | — | ✔ | — |
| Support access | — | — | — | — | — | — | — | grant | time-boxed³ |

¹ Reporting works from pseudonymous/aggregate views; identifiable participant
rows are blocked at RLS (tested).
² School admins may grant teacher/facilitator/participant/caregiver within
their school only.
³ Via `support_grants`: explicit, time-limited (default 4h), recorded. No
silent impersonation exists in the platform.

Multi-role: a user may hold different roles at different schools/programmes;
every check is scoped (`app.has_role(role, school, programme)`).
