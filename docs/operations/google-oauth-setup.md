# Google OAuth Setup for Sport Waikato

## Overview
Google OAuth is used for staff, teacher, and administrator sign-in. Participants do not need Google accounts.

## 1. Google Cloud Console Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project or select the Sport Waikato project
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen:
   - User Type: External
   - App name: "Sport Waikato Programmes"
   - Support email: your@email.co.nz
   - Authorized domains: supabase.co
   - Scopes: email, profile, openid
6. Create OAuth client ID:
   - Application type: Web application
   - Name: "Sport Waikato PWA"
   - Authorized redirect URI: `https://qapzzjkkqsngghlknugl.supabase.co/auth/v1/callback`
   - Click Create
7. Note the **Client ID** and **Client Secret**

## 2. Supabase Configuration

Run this SQL via the Supabase dashboard SQL editor to verify redirect URLs:

```sql
-- Check current auth settings
SELECT * FROM auth.config;
```

Then go to Supabase Dashboard > Authentication > Providers > Google and:
- Enable Google
- Paste Client ID
- Paste Client Secret
- Save

Or configure via Supabase CLI:
```bash
npx supabase login
npx supabase link --project-ref qapzzjkkqsngghlknugl
# Edit supabase/config.toml to add the Google provider
npx supabase config push
```

## 3. Verify

After configuration, go to:
1. The deployed app URL or `http://localhost:3000/auth/login`
2. Click "Continue with Google"
3. You should be redirected to Google sign-in
4. After signing in, you should be redirected back to the dashboard

## 4. Vercel Deploy URL (for production)

When deploying to Vercel, add the production redirect URI:
`https://your-domain.vercel.app/auth/callback`
as an additional authorized redirect URI in Google Cloud Console.

## Current Project Ref
- Supabase project: `qapzzjkkqsngghlknugl`
- Supabase URL: `https://qapzzjkkqsngghlknugl.supabase.co`
- Auth callback: `https://qapzzjkkqsngghlknugl.supabase.co/auth/v1/callback`
