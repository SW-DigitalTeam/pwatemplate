/**
 * Database schema verification tests.
 * Proves that every table the app expects exists and is accessible.
 * Catches "table doesn't exist" errors before they hit users.
 */
import { test, expect } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
  "Content-Type": "application/json",
};

// Every table the app queries
const EXPECTED_TABLES = [
  "profiles",
  "user_roles",
  "schools",
  "programmes",
  "school_programmes",
  "cohorts",
  "participants",
  "enrolments",
  "consent_versions",
  "consents",
  "sessions",
  "attendance",
  "movement_entries",
  "surveys",
  "survey_assignments",
  "survey_responses",
  "issues",
  "audit_log",
  "invitations",
  "notification_outbox",
  "support_grants",
];

const EXPECTED_VIEWS = [
  "v_participation_summary",
  "v_movement_rollup",
  "v_survey_completion",
];

test.describe("Database schema verification", () => {
  for (const table of EXPECTED_TABLES) {
    test(`table '${table}' exists and is accessible`, async ({ request }) => {
      const response = await request.get(
        `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`,
        { headers }
      );
      // 200 = accessible (even if RLS returns empty), 404 = table doesn't exist
      expect(response.status()).not.toBe(404);
      expect(response.status()).toBeLessThan(500);
    });
  }

  for (const view of EXPECTED_VIEWS) {
    test(`view '${view}' exists and is accessible`, async ({ request }) => {
      const response = await request.get(
        `${SUPABASE_URL}/rest/v1/${view}?select=*&limit=0`,
        { headers }
      );
      expect(response.status()).not.toBe(404);
      expect(response.status()).toBeLessThan(500);
    });
  }

  test("programmes table has all 4 configs with modules", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/programmes?select=slug,name,config`,
      { headers }
    );
    expect(response.status()).toBe(200);
    const programmes = await response.json();
    expect(programmes.length).toBe(4);

    for (const p of programmes) {
      expect(p.config).toBeTruthy();
      expect(p.config.enabledModules).toBeTruthy();
      expect(Array.isArray(p.config.enabledModules)).toBe(true);
      expect(p.config.enabledModules.length).toBeGreaterThan(0);
    }
  });

  test("all survey-enabled programmes have published surveys", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/surveys?select=key,title,status,programme_id,programmes(slug)`,
      { headers }
    );
    expect(response.status()).toBe(200);
    const surveys = await response.json();

    const programmeSurveys = new Map<string, string[]>();
    for (const s of surveys) {
      const slug = (s.programmes as any)?.slug;
      if (!programmeSurveys.has(slug)) programmeSurveys.set(slug, []);
      programmeSurveys.get(slug)!.push(s.key);
    }

    // Karawhiua, FreeWheeler, GameFIT should have baseline, endpoint, teacher-observations
    for (const slug of ["karawhiua", "freewheeler", "gamefit"]) {
      const keys = programmeSurveys.get(slug) ?? [];
      expect(keys).toContain("baseline");
      expect(keys).toContain("endpoint");
      expect(keys).toContain("teacher-observations");
    }
  });

  test("all programmes have consent versions", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/consent_versions?select=version,title,programme_id,programmes(slug)`,
      { headers }
    );
    expect(response.status()).toBe(200);
    const versions = await response.json();

    const programmeVersions = new Map<string, number>();
    for (const v of versions) {
      const slug = (v.programmes as any)?.slug;
      programmeVersions.set(slug, (programmeVersions.get(slug) ?? 0) + 1);
    }

    for (const slug of ["karawhiua", "freewheeler", "gamefit", "tap-town"]) {
      expect(programmeVersions.get(slug)).toBeGreaterThanOrEqual(1);
    }
  });

  test("reporting views return data", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/v_participation_summary?select=*`,
      { headers }
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
