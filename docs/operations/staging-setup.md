# Staging environment deployment guide

## Overview

The platform uses Vercel for hosting and Supabase for data. Three environments are recommended:
- **Development**: local (`npm run dev`)
- **Staging**: Vercel preview deployment + staging Supabase project
- **Production**: Vercel production deployment + production Supabase project

---

## Step 1: Create Supabase staging project

1. Go to https://supabase.com/dashboard
2. Click **New project**
3. Name: `sportwaikato-staging`
4. Region: **ap-southeast-2 (Sydney)** — closest to New Zealand
5. Create the project
6. Note the project ref, URL, anon key, and service role key

---

## Step 2: Run migrations on staging

```bash
# Set the staging project URL
export NEXT_PUBLIC_SUPABASE_URL=https://[staging-ref].supabase.co
export SUPABASE_PAT=your-management-api-pat

# Run migrations
npx tsx scripts/sync-config.ts

# Or use the Supabase CLI:
supabase link --project-ref [staging-ref]
supabase db push
```

---

## Step 3: Load synthetic seed data on staging

```bash
# Using Management API:
# Copy the seed_synthetic.sql and run it against the staging database
# via the Supabase dashboard SQL editor or management API
```

---

## Step 4: Create Vercel staging project

1. Go to https://vercel.com
2. Import the GitHub repository
3. Configure:
   - Root directory: `apps/web`
   - Framework: Next.js
   - Build command: `cd ../.. && npm run build`
   - Install command: `npm install`
4. Add environment variables (point at staging Supabase):
   - `NEXT_PUBLIC_SUPABASE_URL` = staging Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = staging anon key
   - `NEXT_PUBLIC_APP_ENV` = `staging`
5. Deploy

---

## Step 5: Configure staging Google OAuth

1. In Google Cloud Console, add the staging URL as an authorized redirect URI:
   - `https://[staging-vercel-url].vercel.app/auth/callback`
2. In the Supabase staging project dashboard:
   - Authentication → Providers → Google
   - Enable Google provider
   - Paste the same Client ID and Secret (or create separate ones for staging)
   - Add the Supabase callback: `https://[staging-ref].supabase.co/auth/v1/callback`

---

## Step 6: Enable staging monitoring

1. Create a separate Sentry project for staging
2. Add `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` to Vercel env vars
3. Set `NEXT_PUBLIC_APP_ENV=staging`
4. Verify: trigger a test error → check Sentry dashboard

---

## Step 7: Verify staging deployment

Run through the smoke test checklist:
- [ ] Home page loads
- [ ] Programme pages render with correct themes
- [ ] Auth pages load (login, signup, access code)
- [ ] Health endpoint returns 200
- [ ] Survey admin page accessible (requires sign-in)
- [ ] Consent admin page accessible (requires sign-in)
- [ ] 84 E2E tests pass against staging

---

## Step 8: Production deployment (when ready)

1. Create Supabase production project (same region: Sydney)
2. Run migrations and seed (synthetic data only for initial setup)
3. Create Vercel production deployment (main branch → auto-deploy)
4. Set production environment variables
5. Enable production Google OAuth with production URLs
6. Create production Sentry project
7. Enable uptime monitoring on production health endpoint
8. Complete the privacy checklist in `docs/privacy/privacy-security-design.md`
9. Run E2E tests against production before going live

---

## Migration promotion process

1. Apply new migrations to staging first
2. Verify migrations succeed and RLS tests pass
3. Apply to production during low-usage hours
4. Migrations are forward-only — rollback = restore from backup + corrective migration

---

## Credential rotation

| Credential | How to rotate |
|---|---|
| Supabase anon key | Rotate in Supabase dashboard → update Vercel env → redeploy |
| Supabase service role | Exists only in Supabase function secrets; rotate there |
| Google OAuth secret | Rotate in Google Cloud Console → update Supabase Auth settings |
| Vercel deploy tokens | Rotate in Vercel settings → update CI secrets |
