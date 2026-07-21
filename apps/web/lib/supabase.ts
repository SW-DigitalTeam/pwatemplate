/**
 * Supabase clients.
 * - Browser client: anon key only. RLS is the security boundary.
 * - Server client: reads auth cookies (via @supabase/ssr) for server components
 *   and route handlers. The service-role key is NEVER used in this app tier;
 *   privileged jobs (outbox sender, imports) run in Supabase Edge Functions.
 */
import { createBrowserClient } from "@supabase/ssr";
import { env } from "./env";

export function supabaseBrowser() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
