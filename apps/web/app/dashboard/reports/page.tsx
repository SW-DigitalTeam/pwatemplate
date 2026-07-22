import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  const roles = await getUserRoles(user.id);
  const canView = roles.some((r) =>
    ["sw_programme_admin", "sw_reporting", "system_admin", "school_admin"].includes(r.role)
  );
  if (!canView) redirect("/dashboard");

  // Get participation summary from the reporting view
  const { data: summary } = await supabase
    .from("v_participation_summary")
    .select("*")
    .order("programme_slug");

  // Get movement rollup
  const { data: movement } = await supabase
    .from("v_movement_rollup")
    .select("*")
    .order("week", { ascending: false })
    .limit(20);

  // Get survey completion
  const { data: surveys } = await supabase
    .from("v_survey_completion")
    .select("*")
    .order("survey_key");

  // Get active schools
  const { count: schoolCount } = await supabase
    .from("schools")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Reports</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-theme border border-current/15 bg-white p-5">
          <span className="text-sm opacity-60">Schools</span>
          <div className="mt-1 text-3xl font-bold text-primary">
            {schoolCount ?? 0}
          </div>
        </div>

        <div className="rounded-theme border border-current/15 bg-white p-5">
          <span className="text-sm opacity-60">Total participants</span>
          <div className="mt-1 text-3xl font-bold text-primary">
            {summary
              ?.reduce((sum, r) => sum + Number(r.registered), 0) ?? 0}
          </div>
        </div>

        <div className="rounded-theme border border-current/15 bg-white p-5">
          <span className="text-sm opacity-60">Active participants</span>
          <div className="mt-1 text-3xl font-bold text-primary">
            {summary?.reduce((sum, r) => sum + Number(r.active), 0) ?? 0}
          </div>
        </div>

        <div className="rounded-theme border border-current/15 bg-white p-5">
          <span className="text-sm opacity-60">Survey responses</span>
          <div className="mt-1 text-3xl font-bold text-primary">
            {surveys
              ?.reduce((sum, r) => sum + Number(r.submitted), 0) ?? 0}
          </div>
        </div>
      </div>

      {summary && summary.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">
            Participation by programme
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-current/15">
                  <th className="pb-2 font-medium opacity-70">Programme</th>
                  <th className="pb-2 font-medium opacity-70">Region</th>
                  <th className="pb-2 font-medium opacity-70">Registered</th>
                  <th className="pb-2 font-medium opacity-70">Active</th>
                  <th className="pb-2 font-medium opacity-70">Completed</th>
                  <th className="pb-2 font-medium opacity-70">Withdrawn</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-current/10"
                  >
                    <td className="py-2 font-medium">{row.programme_slug}</td>
                    <td className="py-2">{row.region}</td>
                    <td className="py-2">{row.registered}</td>
                    <td className="py-2">{row.active}</td>
                    <td className="py-2">{row.completed}</td>
                    <td className="py-2">{row.withdrawn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {surveys && surveys.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">
            Survey completion
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-current/15">
                  <th className="pb-2 font-medium opacity-70">Survey</th>
                  <th className="pb-2 font-medium opacity-70">Version</th>
                  <th className="pb-2 font-medium opacity-70">Submitted</th>
                  <th className="pb-2 font-medium opacity-70">In progress</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((row, i) => (
                  <tr key={i} className="border-b border-current/10">
                    <td className="py-2 font-medium">{row.survey_key}</td>
                    <td className="py-2">v{row.version}</td>
                    <td className="py-2">{row.submitted}</td>
                    <td className="py-2">{row.in_progress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {movement && movement.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">
            Recent movement
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-current/15">
                  <th className="pb-2 font-medium opacity-70">Programme</th>
                  <th className="pb-2 font-medium opacity-70">Measure</th>
                  <th className="pb-2 font-medium opacity-70">Unit</th>
                  <th className="pb-2 font-medium opacity-70">Week</th>
                  <th className="pb-2 font-medium opacity-70">Total</th>
                  <th className="pb-2 font-medium opacity-70">Participants</th>
                </tr>
              </thead>
              <tbody>
                {movement.map((row, i) => (
                  <tr key={i} className="border-b border-current/10">
                    <td className="py-2 font-medium">{row.programme_slug}</td>
                    <td className="py-2">{row.measure_key}</td>
                    <td className="py-2">{row.unit}</td>
                    <td className="py-2">{row.week}</td>
                    <td className="py-2">{row.total_value}</td>
                    <td className="py-2">{row.participants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!summary?.length && !movement?.length && !surveys?.length && (
        <p className="mt-8 opacity-70">
          No reporting data available yet. Data will appear as programmes run sessions and collect surveys.
        </p>
      )}
    </div>
  );
}
