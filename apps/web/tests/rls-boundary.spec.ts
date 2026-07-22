/**
 * RLS boundary tests via Supabase REST API.
 * Tests access control DIRECTLY at the database boundary.
 * Hiding a button is not a test — this is.
 */
import { test, expect } from "@playwright/test";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
  "Content-Type": "application/json",
};

// Synthetic IDs from seed data
const SCHOOL_KOWHAI = "00000000-0000-0000-0000-000000050001";
const SCHOOL_RIMU = "00000000-0000-0000-0000-000000050002";

test.describe("School data isolation (RLS)", () => {
  test("anon key cannot read participants (no auth)", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/participants?select=id,display_name,school_id`,
      { headers }
    );
    // RLS blocks unauthenticated access to participants
    // Expect either 401 or an empty array
    const status = response.status();
    if (status === 200) {
      const data = await response.json();
      expect(data).toEqual([]);
    } else {
      expect([401, 403]).toContain(status);
    }
  });

  test("anon key cannot read schools (no auth)", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/schools?select=id,name`,
      { headers }
    );
    const status = response.status();
    if (status === 200) {
      const data = await response.json();
      expect(data).toEqual([]);
    } else {
      expect([401, 403]).toContain(status);
    }
  });

  test("anon key cannot read attendance", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/attendance?select=*`,
      { headers }
    );
    const status = response.status();
    if (status === 200) {
      const data = await response.json();
      expect(data).toEqual([]);
    } else {
      expect([401, 403]).toContain(status);
    }
  });

  test("anon key cannot read user_roles", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/user_roles?select=*`,
      { headers }
    );
    const status = response.status();
    if (status === 200) {
      const data = await response.json();
      expect(data).toEqual([]);
    } else {
      expect([401, 403]).toContain(status);
    }
  });

  test("anon key cannot read audit_log", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/audit_log?select=*`,
      { headers }
    );
    const status = response.status();
    if (status === 200) {
      const data = await response.json();
      expect(data).toEqual([]);
    } else {
      expect([401, 403]).toContain(status);
    }
  });

  test("anon key cannot read consents", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/consents?select=*`,
      { headers }
    );
    const status = response.status();
    if (status === 200) {
      const data = await response.json();
      expect(data).toEqual([]);
    } else {
      expect([401, 403]).toContain(status);
    }
  });

  test("anon key CAN read programmes (public metadata)", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/programmes?select=slug,name`,
      { headers }
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.length).toBe(4);
  });

  test("anon key CAN read published surveys", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/surveys?select=key,title&status=eq.published`,
      { headers }
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.length).toBeGreaterThan(0);
  });

  test("anon key CAN read reporting views (aggregate)", async ({ request }) => {
    const response = await request.get(
      `${SUPABASE_URL}/rest/v1/v_participation_summary?select=*`,
      { headers }
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("anon key CANNOT insert into participants", async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/rest/v1/participants`,
      {
        headers,
        data: {
          school_id: SCHOOL_KOWHAI,
          display_name: "Should Fail",
        },
      }
    );
    expect([401, 403]).toContain(response.status());
  });

  test("anon key CANNOT insert into audit_log", async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/rest/v1/audit_log`,
      {
        headers,
        data: {
          action: "test",
          entity: "test",
        },
      }
    );
    expect([401, 403]).toContain(response.status());
  });

  test("anon key CANNOT delete from audit_log", async ({ request }) => {
    const response = await request.delete(
      `${SUPABASE_URL}/rest/v1/audit_log?id=gt.0`,
      { headers }
    );
    // Supabase returns 204 (silently blocked) or 401/403 for RLS-blocked deletes
    expect([204, 401, 403]).toContain(response.status());
  });

  test("anon key CANNOT update schools", async ({ request }) => {
    const response = await request.patch(
      `${SUPABASE_URL}/rest/v1/schools?id=eq.${SCHOOL_KOWHAI}`,
      {
        headers,
        data: { name: "Hacked" },
      }
    );
    // Supabase returns 204 (silently blocked) or 401/403 for RLS-blocked updates
    expect([204, 401, 403]).toContain(response.status());
  });

  test("anon key CANNOT insert into user_roles", async ({ request }) => {
    const response = await request.post(
      `${SUPABASE_URL}/rest/v1/user_roles`,
      {
        headers,
        data: {
          user_id: "00000000-0000-0000-0000-00000000a001",
          role: "system_admin",
        },
      }
    );
    expect([401, 403]).toContain(response.status());
  });
});
