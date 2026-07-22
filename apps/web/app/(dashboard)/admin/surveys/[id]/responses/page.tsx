import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/server";

export default async function SurveyResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  const roles = await getUserRoles(user.id);
  const canView = roles.some((r) =>
    ["sw_programme_admin", "system_admin", "sw_reporting"].includes(r.role)
  );
  if (!canView) redirect("/dashboard");

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, title, key, anonymity, definition, programmes(name)")
    .eq("id", id)
    .single();

  if (!survey) notFound();

  const { data: responses } = await supabase
    .from("survey_responses")
    .select("id, status, answers, submitted_at, respondent_role, pseudonym")
    .eq("survey_id", id)
    .order("submitted_at", { ascending: false, nullsFirst: false });

  const definition = survey.definition as {
    sections: Array<{
      id: string;
      title: string;
      questions: Array<{ id: string; label: string; type: string }>;
    }>;
  };

  const submitted = responses?.filter((r) => r.status === "submitted") ?? [];
  const inProgress = responses?.filter((r) => r.status === "in_progress") ?? [];

  return (
    <div>
      <a
        href="/admin/surveys"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Back to surveys
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Responses: {survey.title}
      </h1>
      <p className="text-sm opacity-70">
        {submitted.length} submitted · {inProgress.length} in progress ·{" "}
        {survey.anonymity}
      </p>

      {/* Summary stats */}
      {submitted.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-theme border border-current/15 bg-white p-4">
            <span className="text-sm opacity-60">Submitted</span>
            <div className="text-2xl font-bold text-primary">{submitted.length}</div>
          </div>
          <div className="rounded-theme border border-current/15 bg-white p-4">
            <span className="text-sm opacity-60">In progress</span>
            <div className="text-2xl font-bold text-amber-600">{inProgress.length}</div>
          </div>
          <div className="rounded-theme border border-current/15 bg-white p-4">
            <span className="text-sm opacity-60">Response rate</span>
            <div className="text-2xl font-bold text-primary">
              {submitted.length + inProgress.length > 0
                ? Math.round(
                    (submitted.length /
                      (submitted.length + inProgress.length)) *
                      100
                  )
                : 0}
              %
            </div>
          </div>
        </div>
      )}

      {/* Question-by-question analysis */}
      {definition?.sections?.map((section) => (
        <section key={section.id} className="mt-10">
          <h2 className="font-display text-lg font-semibold">{section.title}</h2>
          <div className="mt-4 space-y-4">
            {section.questions.map((q) => {
              const answers = submitted
                .map((r) => (r.answers as Record<string, unknown>)?.[q.id])
                .filter(Boolean);

              return (
                <div
                  key={q.id}
                  className="rounded-theme border border-current/15 bg-white p-4"
                >
                  <h3 className="text-sm font-medium">{q.label}</h3>

                  {q.type === "rating" || q.type === "agreement" ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {(() => {
                            const nums = answers.map(Number).filter(Boolean);
                            const avg =
                              nums.length > 0
                                ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
                                : "—";
                            const dist = [1, 2, 3, 4, 5].map(
                              (n) => nums.filter((v) => v === n).length
                            );
                            return (
                              <>
                                <div className="flex h-6 gap-0.5">
                                  {dist.map((count, i) => (
                                    <div
                                      key={i}
                                      className="flex-1 rounded-sm bg-primary/20"
                                      style={{
                                        height: `${Math.max(
                                          (count / Math.max(...dist, 1)) * 100,
                                          5
                                        )}%`,
                                        alignSelf: "flex-end",
                                      }}
                                      title={`${i + 1}: ${count} responses`}
                                    />
                                  ))}
                                </div>
                                <div className="mt-1 flex justify-between text-xs opacity-60">
                                  <span>1</span>
                                  <span>Avg: {avg}</span>
                                  <span>5</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <span className="text-sm opacity-60">
                          {answers.length} responses
                        </span>
                      </div>
                    </div>
                  ) : q.type === "single_choice" || q.type === "yes_no" ? (
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const counts = new Map<string, number>();
                        for (const a of answers) {
                          const key = String(a);
                          counts.set(key, (counts.get(key) ?? 0) + 1);
                        }
                        return Array.from(counts.entries())
                          .sort((a, b) => b[1] - a[1])
                          .map(([value, count]) => (
                            <div
                              key={value}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{value}</span>
                              <span className="font-medium">
                                {count} ({Math.round((count / answers.length) * 100)}%)
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  ) : q.type === "multiple_choice" ? (
                    <div className="mt-2 space-y-1">
                      {(() => {
                        const counts = new Map<string, number>();
                        for (const a of answers) {
                          for (const opt of a as string[]) {
                            counts.set(opt, (counts.get(opt) ?? 0) + 1);
                          }
                        }
                        return Array.from(counts.entries())
                          .sort((a, b) => b[1] - a[1])
                          .map(([value, count]) => (
                            <div
                              key={value}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>{value}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ));
                      })()}
                    </div>
                  ) : (
                    <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                      {answers.slice(0, 5).map((a, i) => (
                        <p
                          key={i}
                          className="rounded bg-gray-50 p-2 text-sm opacity-80"
                        >
                          {String(a)}
                        </p>
                      ))}
                      {answers.length > 5 && (
                        <p className="text-xs opacity-50">
                          + {answers.length - 5} more responses
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {submitted.length === 0 && (
        <p className="mt-8 text-center opacity-70">
          No submitted responses yet.
        </p>
      )}
    </div>
  );
}
