# Sentry setup checklist

## 1. Create Sentry projects (one-time)
Go to https://sentry.io and create:
- [ ] **Development** project (Next.js platform)
- [ ] **Staging** project (Next.js platform)
- [ ] **Production** project (Next.js platform)

Note the DSN for each.

## 2. Configure PII scrubbing
In each Sentry project settings:
- [ ] Data Scrubbing: ON
- [ ] Default Sensitive Data: ON
- [ ] IP Addresses: Prevent collection
- [ ] Use enhanced data scrubbing: ON

Add these sensitive field names (project settings > Security & Privacy):
```
email
name
display_name
participant
password
token
secret
key
answer
response
survey
content_md
granted_by_name
```

## 3. Set environment variables
In Vercel (or your hosting platform):

| Variable | Environment | Value |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | All | Development DSN |
| `SENTRY_DSN` | Server only | Same DSN |
| `SENTRY_ORG` | CI only | Your Sentry org slug |
| `SENTRY_PROJECT` | CI only | Your Sentry project slug |
| `SENTRY_AUTH_TOKEN` | CI only | Auth token for source map upload |

For local development, add to `apps/web/.env.local`:
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

## 4. Configure alerts
In Sentry > Alerts:
- [ ] New issue type → Email: SW digital lead + maintainer
- [ ] >10 events/hour on same issue → Email: SW digital lead
- [ ] Performance regression (>20% slower) → Email: maintainer
- [ ] Set alert environment filter: production only for critical alerts

## 5. Set up uptime monitoring
Sentry > Uptime Monitoring:
- [ ] URL: `https://your-domain.vercel.app/api/health`
- [ ] Interval: 5 minutes
- [ ] Alert after 2 consecutive failures
- [ ] Alert recipients: SW digital lead + maintainer

## 6. Verify safe test event
After deployment:
1. Go to your app and trigger a test error (e.g. throw in browser console)
2. Check Sentry dashboard for the event
3. Verify NO PII is attached (no names, emails, survey text)
4. Mark this checklist complete

## 7. Cost management
- [ ] Set monthly event quota alert at 80% of plan
- [ ] Review event volume weekly
- [ ] Filter out noisy errors (browser extensions, bot traffic)

## Privacy rules (enforced in code)
- `beforeSend` hook strips: email, name, IP, form data, survey answers
- No `request.data` ever sent
- No `user.email` or `user.name` ever sent
- Participant pseudonyms are safe to include (no PII)
- Server DSN is separate from client DSN (server-only env var)
