# ADR-0003: Data hosting, residency, costs, vendor exit

## Data residency
Supabase projects should be created in the **Sydney (ap-southeast-2)** region —
the closest region to New Zealand; Supabase has no NZ region. Vercel functions
pinned to `syd1`. This keeps participant data in Australia under AWS
infrastructure. The NZ Privacy Act 2020 (IPP 12) permits offshore disclosure
where comparable safeguards exist; record this in the privacy review and note
it in school-facing privacy information. Māori data governance expectations may
be stricter than the legal floor — see docs/privacy and consult partners before
programmes with iwi/hapū data (e.g. Tap Town routes, Haerenga-type content).

## Expected operating costs (indicative, NZD/month, verify at setup)
| Volume | Supabase | Vercel | Monitoring (Sentry) | Email (Resend) | Total |
|---|---|---|---|---|---|
| Pilot (≤2k participants) | $0–45 (Free/Pro) | $0–35 | $0 (dev tier) | $0–35 | **$0–115** |
| Regional (≤20k) | ~$45–120 | ~$35 | ~$45 | ~$35 | **$160–235** |
| Multi-programme scale (≤100k) | $200+ (compute add-ons) | $35–150 | $45–90 | $35–90 | **$315–530** |
Plus staging project (~half production cost) and domains.

## Vendor dependencies & exit
- **PostgreSQL is the portability anchor.** `pg_dump` restores to any Postgres.
  RLS policies, functions and triggers are plain SQL — portable.
- **Supabase Auth:** exit = migrate `auth.users` to another OIDC provider;
  Google-linked accounts re-link by email. Medium effort.
- **Vercel:** Next.js runs on any Node host or container. Low effort.
- **Sentry/Resend:** swappable behind thin wrappers. Low effort.
- Highest lock-in is Supabase client libraries in app code; mitigated by keeping
  data access behind typed helpers so a swap touches one layer.

## Known architectural limitations
Single-region, single-org, no read replicas, no queue system (outbox table +
cron instead). All acceptable at pilot/regional scale; revisit at the triggers
in ADR-0002.
