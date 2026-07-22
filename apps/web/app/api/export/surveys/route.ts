import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null);

  const isAdmin = roles?.some((r) =>
    ["sw_programme_admin", "sw_reporting", "system_admin"].includes(r.role)
  );

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const surveyId = searchParams.get("survey_id");

  let query = supabase
    .from("survey_responses")
    .select(
      "id, status, answers, submitted_at, respondent_role, pseudonym, surveys(key, title)"
    );

  if (surveyId) query = query.eq("survey_id", surveyId);

  const { data: responses } = await query
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  if (!responses || responses.length === 0) {
    return NextResponse.json({ error: "No data" }, { status: 404 });
  }

  // Build CSV with dynamic columns from answers
  const allKeys = new Set<string>();
  for (const r of responses) {
    const answers = r.answers as Record<string, unknown>;
    if (answers) Object.keys(answers).forEach((k) => allKeys.add(k));
  }

  const answerHeaders = Array.from(allKeys).sort();
  const headers = [
    "Survey",
    "Survey Key",
    "Pseudonym",
    "Role",
    "Status",
    "Submitted At",
    ...answerHeaders,
  ];

  const rows = responses.map((r) => {
    const answers = (r.answers as Record<string, unknown>) ?? {};
    return [
      `"${(((r.surveys as unknown as { title: string })?.title ?? "").replace(/"/g, '""'))}"`,
      ((r.surveys as unknown as { key: string })?.key ?? ""),
      r.pseudonym ?? "",
      r.respondent_role,
      r.status,
      r.submitted_at ?? "",
      ...answerHeaders.map((key) => {
        const val = answers[key];
        if (Array.isArray(val)) return `"${val.join("; ")}"`;
        return typeof val === "string"
          ? `"${val.replace(/"/g, '""')}"`
          : String(val ?? "");
      }),
    ];
  });

  const csv =
    headers.join(",") +
    "\n" +
    rows.map((r) => r.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=survey-responses-${new Date().toISOString().split("T")[0]}.csv`,
    },
  });
}
