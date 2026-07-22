/**
 * Syncs ProgrammeConfig from packages/programme-config to the database.
 * Reads each config, serializes to JSONB, and upserts into programmes.config.
 *
 * Usage: npx tsx scripts/sync-config.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars,
 * or run via the Supabase Management API with a PAT.
 */

import { programmes } from "@sw/programme-config";
import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAT = process.env.SUPABASE_PAT;

if (!SUPABASE_URL && !PAT) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_PAT");
  process.exit(1);
}

async function run() {
  const entries = Object.entries(programmes);
  console.log(`Syncing ${entries.length} programme configs...`);

  for (const [slug, config] of entries) {
    const configJson = JSON.stringify(config);
    console.log(`  ${slug}: ${configJson.length} bytes`);

    if (PAT) {
      // Use Management API
      const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
      if (!projectRef) {
        console.error("Could not extract project ref from NEXT_PUBLIC_SUPABASE_URL");
        continue;
      }

      const sql = `
        UPDATE public.programmes
        SET config = '${configJson.replace(/'/g, "''")}'::jsonb,
            config_version = config_version + 1,
            updated_at = now()
        WHERE slug = '${slug}';
      `;

      const resp = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PAT}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: sql }),
        }
      );

      if (!resp.ok) {
        const err = await resp.text();
        console.error(`  ${slug}: FAILED - ${err}`);
      } else {
        console.log(`  ${slug}: synced`);
      }
    } else if (SUPABASE_URL && SERVICE_KEY) {
      // Use REST API
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/programmes?slug=eq.${slug}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ config, config_version: Date.now() }),
      });

      if (!resp.ok) {
        console.error(`  ${slug}: FAILED - ${await resp.text()}`);
      } else {
        console.log(`  ${slug}: synced`);
      }
    }
  }

  console.log("Config sync complete.");
}

run().catch(console.error);
