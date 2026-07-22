import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const schoolId = searchParams.get("school_id");
  const programmeSlug = searchParams.get("programme");

  // Check admin access
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role, school_id")
    .eq("user_id", user.id)
    .is("revoked_at", null);

  const isAdmin = roles?.some((r) =>
    ["sw_programme_admin", "sw_reporting", "system_admin"].includes(r.role)
  );
  const canAccessSchool = roles?.some(
    (r) =>
      r.school_id === schoolId &&
      ["school_admin", "teacher", "facilitator"].includes(r.role)
  );

  if (!isAdmin && !canAccessSchool) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let query = supabase
    .from("participants")
    .select(
      "id, pseudonym, display_name, year_level, status, access_method, accessibility_notes, created_at, schools(name)"
    );

  if (schoolId) query = query.eq("school_id", schoolId);

  const { data: participants } = await query.order("display_name");

  if (!participants) {
    return NextResponse.json({ error: "No data" }, { status: 404 });
  }

  // Build CSV
  const headers = [
    "Pseudonym",
    "Display Name",
    "Year Level",
    "Status",
    "School",
    "Access Method",
    "Accessibility Notes",
    "Created At",
  ];
  const rows = participants.map((p) => [
    p.pseudonym,
    `"${(p.display_name ?? "").replace(/"/g, '""')}"`,
    p.year_level ?? "",
    p.status,
    `"${((p.schools as unknown as { name: string })?.name ?? "").replace(/"/g, '""')}"`,
    p.access_method,
    `"${(p.accessibility_notes ?? "").replace(/"/g, '""')}"`,
    p.created_at,
  ]);

  const csv =
    headers.join(",") +
    "\n" +
    rows.map((r) => r.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=participants-${new Date().toISOString().split("T")[0]}.csv`,
    },
  });
}
