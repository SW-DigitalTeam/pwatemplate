import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/server";

export default async function AdminSchoolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  const roles = await getUserRoles(user.id);
  const isAdmin = roles.some((r) =>
    ["sw_programme_admin", "system_admin"].includes(r.role)
  );
  if (!isAdmin) redirect("/dashboard");

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name, town, region, contact_name, contact_email, status, created_at")
    .order("created_at", { ascending: false });

  const pending = schools?.filter((s) => s.status === "pending") ?? [];
  const approved = schools?.filter((s) => s.status === "approved") ?? [];
  const other = schools?.filter(
    (s) => !["pending", "approved"].includes(s.status)
  ) ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Schools</h1>

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">
            Pending applications{" "}
            <span className="rounded bg-amber-100 px-2 py-0.5 text-sm text-amber-800">
              {pending.length}
            </span>
          </h2>
          <div className="mt-4 space-y-3">
            {pending.map((school) => (
              <div
                key={school.id}
                className="rounded-theme border border-current/15 bg-white p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {school.name}
                    </h3>
                    <p className="text-sm opacity-70">
                      {school.town}, {school.region}
                    </p>
                    <p className="mt-1 text-sm">
                      Contact: {school.contact_name} ({school.contact_email})
                    </p>
                    <p className="mt-1 text-xs opacity-50">
                      Applied: {new Date(school.created_at).toLocaleDateString("en-NZ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/admin/schools/${school.id}`}
                      className="rounded-theme bg-primary px-4 py-2 text-sm font-medium text-primary-contrast hover:opacity-90"
                    >
                      Review
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">
            Active schools{" "}
            <span className="text-sm font-normal opacity-70">
              ({approved.length})
            </span>
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {approved.map((school) => (
              <a
                key={school.id}
                href={`/admin/schools/${school.id}`}
                className="rounded-theme border border-current/15 bg-white p-4 hover:bg-primary hover:text-primary-contrast"
              >
                <h3 className="font-display font-semibold">{school.name}</h3>
                <p className="text-sm opacity-70">
                  {school.town}, {school.region}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Other</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {other.map((school) => (
              <a
                key={school.id}
                href={`/admin/schools/${school.id}`}
                className="rounded-theme border border-current/15 bg-white p-4"
              >
                <h3 className="font-display font-semibold">{school.name}</h3>
                <p className="text-sm opacity-70">{school.status}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {schools?.length === 0 && (
        <p className="mt-8 opacity-70">No schools have registered yet.</p>
      )}
    </div>
  );
}
