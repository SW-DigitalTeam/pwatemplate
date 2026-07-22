import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/server";

export default async function SchoolDashboardPage({
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

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", id)
    .single();

  if (!school) notFound();

  const roles = await getUserRoles(user.id);
  const canManage = roles.some(
    (r) =>
      r.school_id === id &&
      ["school_admin", "teacher", "facilitator"].includes(r.role)
  );

  if (!canManage) {
    redirect("/dashboard");
  }

  const { data: schoolProgrammes } = await supabase
    .from("school_programmes")
    .select("id, status, intended_participants, programmes(name, slug)")
    .eq("school_id", id);

  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id, name, kind, school_programme_id");

  const { data: participants } = await supabase
    .from("participants")
    .select("id, display_name, status")
    .eq("school_id", id);

  return (
    <div>
      <a
        href="/dashboard"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Dashboard
      </a>

      <h1 className="mt-4 font-display text-3xl font-bold">{school.name}</h1>
      <p className="text-sm opacity-70">
        {school.town}, {school.region} &middot; {school.status}
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Programmes card */}
        <div className="rounded-theme border border-current/15 bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Programmes</h2>
          {schoolProgrammes && schoolProgrammes.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {schoolProgrammes.map((sp) => (
                <li key={sp.id} className="text-sm">
                  <span className="font-medium">
                    {(sp.programmes as unknown as { name: string })?.name ??
                      "Programme"}
                  </span>
                  <br />
                  <span className="text-xs opacity-60">Status: {sp.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm opacity-70">No programmes active.</p>
          )}
        </div>

        {/* Cohorts card */}
        <div className="rounded-theme border border-current/15 bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Groups</h2>
          {cohorts && cohorts.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {cohorts.map((c) => (
                <li key={c.id} className="text-sm">
                  {c.name}{" "}
                  <span className="text-xs opacity-60">({c.kind})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm opacity-70">No groups created yet.</p>
          )}
          <a
            href={`/schools/${id}/cohorts`}
            className="mt-3 inline-block text-sm font-medium text-primary underline hover:opacity-80"
          >
            Manage groups
          </a>
        </div>

        {/* Participants card */}
        <div className="rounded-theme border border-current/15 bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Participants</h2>
          <div className="mt-3">
            <span className="text-3xl font-bold text-primary">
              {participants?.length ?? 0}
            </span>
            <p className="text-sm opacity-70">
              {(participants?.filter((p) => p.status === "active")?.length ?? 0)}{" "}
              active
            </p>
          </div>
          <a
            href={`/schools/${id}/participants`}
            className="mt-3 inline-block text-sm font-medium text-primary underline hover:opacity-80"
          >
            View participants
          </a>
        </div>

        {/* Staff card */}
        <div className="rounded-theme border border-current/15 bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Staff</h2>
          <a
            href={`/schools/${id}/staff`}
            className="mt-3 inline-block text-sm font-medium text-primary underline hover:opacity-80"
          >
            Manage staff
          </a>
        </div>

        {/* Sessions card */}
        <div className="rounded-theme border border-current/15 bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Sessions</h2>
          <a
            href={`/schools/${id}/sessions`}
            className="mt-3 inline-block text-sm font-medium text-primary underline hover:opacity-80"
          >
            View sessions
          </a>
        </div>

        {/* Quick actions card */}
        <div className="rounded-theme border border-current/15 bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Quick actions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={`/schools/${id}/participants/new`}
                className="font-medium text-primary underline hover:opacity-80"
              >
                Enrol participant
              </a>
            </li>
            <li>
              <a
                href={`/sessions/new?school_id=${id}`}
                className="font-medium text-primary underline hover:opacity-80"
              >
                Schedule session
              </a>
            </li>
            <li>
              <a
                href={`/issues/new?school_id=${id}`}
                className="font-medium text-primary underline hover:opacity-80"
              >
                Report an issue
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
