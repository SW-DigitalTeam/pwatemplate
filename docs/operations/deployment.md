# Deployment guide

## First-time setup
1. **Supabase**: create projects (staging, production) in ap-southeast-2.
   Run migrations in order via Supabase CLI: `supabase db push` (link project
   first). Create demo users only in staging. Enable Google provider
   (Google Cloud OAuth client), email magic links, and MFA enforcement for
   privileged roles.
2. **Vercel**: import repo, root `apps/web`, set env vars from `.env.example`
   per environment, region syd1, enable preview deployments; protect
   production with required CI checks.
3. **GitHub**: branch protection on `main` (require CI app + database jobs);
   add `SUPABASE_*` secrets only where CI needs them (currently none — CI uses
   its own Postgres service).
4. **Monitoring**: Sentry projects per env (PII scrubbing ON, send safe test
   event); uptime check on `/api/health`.

## Each release
PR → CI green → merge → Vercel deploys → verify health + smoke flow → tag.

## Migration promotion
Apply to staging first, run `scripts/test-db.sh` against a staging branch
database, then production during low-usage hours. Forward-only; rollback =
restore + corrective migration (runbook).

## Credential rotation
Supabase anon key: rotate in dashboard → update Vercel env → redeploy.
Service-role: exists only in Supabase function secrets; rotate there.
Google OAuth secret: rotate in Google Cloud console → Supabase Auth settings.
Record rotations in the audit issue.
