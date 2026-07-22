import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/server";

export default async function AdminPrivacyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const roles = await getUserRoles(user.id);
  const isAdmin = roles.some((r) =>
    ["sw_programme_admin", "system_admin"].includes(r.role)
  );
  if (!isAdmin) redirect("/dashboard");

  // Get all privacy-related issues (using data_quality category with privacy keywords)
  const { data: requests } = await supabase
    .from("issues")
    .select("id, title, detail, status, severity, created_at, reported_by")
    .or("title.ilike.%privacy%,title.ilike.%deletion%,title.ilike.%access%,title.ilike.%withdraw%")
    .order("created_at", { ascending: false });

  const { data: participants } = await supabase
    .from("participants")
    .select("id, display_name, pseudonym, status, schools(name)")
    .order("display_name");

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Privacy requests</h1>
      <p className="mt-2 text-sm opacity-70">
        Review and process privacy requests under the Privacy Act 2020. Sport Waikato must respond within 20 working days.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Pending requests</h2>
        {(!requests || requests.length === 0) && (
          <p className="mt-4 text-sm opacity-70">No privacy requests pending.</p>
        )}
        <div className="mt-4 space-y-3">
          {requests?.map((r) => (
            <div key={r.id} className="rounded-theme border border-current/15 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="mt-1 text-sm opacity-70 whitespace-pre-wrap">{r.detail}</p>
                  <p className="mt-2 text-xs opacity-50">
                    Submitted {new Date(r.created_at).toLocaleDateString("en-NZ")}
                  </p>
                </div>
                <span
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    r.status === "open"
                      ? "bg-amber-100 text-amber-800"
                      : r.status === "resolved"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              {r.status === "open" && (
                <div className="mt-3 flex gap-2">
                  <span className="text-xs font-medium text-amber-700">
                    ⚠ Response required within 20 working days. Record all actions in the audit log.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Active participants</h2>
        <p className="text-sm opacity-70">
          Search for a participant to view their data or process a deletion request.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-current/15">
                <th className="pb-2 font-medium opacity-70">Pseudonym</th>
                <th className="pb-2 font-medium opacity-70">Display name</th>
                <th className="pb-2 font-medium opacity-70">School</th>
                <th className="pb-2 font-medium opacity-70">Status</th>
                <th className="pb-2 font-medium opacity-70">Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants?.slice(0, 50).map((p) => (
                <tr key={p.id} className="border-b border-current/10">
                  <td className="py-2 font-mono text-xs">{p.pseudonym}</td>
                  <td className="py-2">{p.display_name}</td>
                  <td className="py-2">{(p.schools as unknown as { name: string })?.name ?? "—"}</td>
                  <td className="py-2">{p.status}</td>
                  <td className="py-2">
                    <a
                      href={`/privacy/request?participant=${p.id}`}
                      className="text-xs text-primary underline hover:opacity-80"
                    >
                      View data
                    </a>
                  </td>
                </tr>
              ))}
              {(!participants || participants.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-4 text-center opacity-50">No participants.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 rounded-theme border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-display text-lg font-semibold text-amber-800">Process checklist</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-amber-700">
          <li>Verify the requester's identity (match name and/or account).</li>
          <li>Determine what data is held (participants, consents, survey_responses, movement_entries, attendance).</li>
          <li>Export the data for an access request; anonymize PII for a deletion request.</li>
          <li>Record all actions in the audit log with <code>app.write_audit()</code>.</li>
          <li>Update the issue status to 'resolved' and add a summary note.</li>
          <li>Confirm with the requester that the request has been processed.</li>
        </ol>
      </section>
    </div>
  );
}
