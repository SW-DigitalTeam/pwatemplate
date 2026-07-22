import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/server";

export default async function AdminSurveysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  const roles = await getUserRoles(user.id);
  const isAdmin = roles.some((r) =>
    ["sw_programme_admin", "system_admin"].includes(r.role)
  );
  if (!isAdmin) redirect("/dashboard");

  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, key, title, version, status, anonymity, created_at, programmes(name, slug)")
    .order("created_at", { ascending: false });

  const { data: responses } = await supabase
    .from("survey_responses")
    .select("survey_id, status");

  const responseCounts = new Map<string, { submitted: number; in_progress: number }>();
  for (const r of responses ?? []) {
    const existing = responseCounts.get(r.survey_id) ?? { submitted: 0, in_progress: 0 };
    if (r.status === "submitted") existing.submitted++;
    else existing.in_progress++;
    responseCounts.set(r.survey_id, existing);
  }

  const grouped = new Map<string, typeof surveys>();
  for (const s of surveys ?? []) {
    const slug = (s.programmes as unknown as { slug: string })?.slug ?? "unknown";
    if (!grouped.has(slug)) grouped.set(slug, []);
    grouped.get(slug)!.push(s);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Surveys</h1>
        <a
          href="/dashboard/admin/surveys/new"
          className="rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Create survey
        </a>
      </div>

      {Array.from(grouped.entries()).map(([slug, progSurveys]) => (
        <section key={slug} className="mt-10">
          <h2 className="font-display text-xl font-semibold capitalize">
            {(progSurveys?.[0]?.programmes as unknown as { name: string })?.name ?? slug}
          </h2>
          <div className="mt-4 space-y-3">
            {progSurveys?.map((survey) => {
              const counts = responseCounts.get(survey.id);
              return (
                <div
                  key={survey.id}
                  className="rounded-theme border border-current/15 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">
                        {survey.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm opacity-70">
                        <span className="capitalize">{survey.key}</span>
                        <span>v{survey.version}</span>
                        <span className="capitalize">{survey.anonymity}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            survey.status === "published"
                              ? "bg-green-100 text-green-800"
                              : survey.status === "draft"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {survey.status}
                        </span>
                      </div>
                      {counts && (
                        <p className="mt-2 text-sm">
                          <span className="font-medium text-green-700">{counts.submitted} submitted</span>
                          {" · "}
                          <span className="text-amber-700">{counts.in_progress} in progress</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/admin/surveys/${survey.id}/assign`}
                        className="rounded-theme border border-current/20 px-3 py-2 text-sm hover:bg-primary hover:text-primary-contrast"
                      >
                        Assign
                      </a>
                      <a
                        href={`/admin/surveys/${survey.id}/responses`}
                        className="rounded-theme border border-current/20 px-3 py-2 text-sm hover:bg-primary hover:text-primary-contrast"
                      >
                        Responses
                      </a>
                      <a
                        href={`/admin/surveys/${survey.id}/edit`}
                        className="rounded-theme border border-current/20 px-3 py-2 text-sm hover:bg-primary hover:text-primary-contrast"
                      >
                        Edit
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {(!surveys || surveys.length === 0) && (
        <p className="mt-8 opacity-70">
          No surveys created yet. Create your first survey to start collecting
          participant feedback.
        </p>
      )}
    </div>
  );
}
