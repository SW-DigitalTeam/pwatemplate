# ADR-0002: Modular monolith, configuration-driven

**Status:** accepted

One app, one database. Modules are enabled per programme through
`ProgrammeConfig.enabledModules`; schema-level validation enforces module
dependencies (e.g. attendance requires sessions) and safety rules (identifiable
leaderboards rejected by default).

Microservices were rejected: the team is small, programmes share 90% of
capability, and operational surface (deploys, monitoring, secrets) must stay
manageable for a solo maintainer or small agency.

**When this architecture must change:** if a single programme's traffic
profile diverges by an order of magnitude (e.g. Tap Town at whole-town scale
with high-frequency beacon writes), extract an ingest-only service for that
write path first; keep everything else monolithic. Second trigger: if two
organisations beyond Sport Waikato adopt the platform, revisit multi-tenant
isolation (today: single-org, school-scoped).
