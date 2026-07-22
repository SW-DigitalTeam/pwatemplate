import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/server";
import { ApproveSchoolForm } from "./approve-form";

export default async function AdminSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");
  const roles = await getUserRoles(user.id);
  const isAdmin = roles.some((r) =>
    ["sw_programme_admin", "system_admin"].includes(r.role)
  );
  if (!isAdmin) redirect("/dashboard");

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", id)
    .single();

  if (!school) notFound();

  const { data: schoolProgrammes } = await supabase
    .from("school_programmes")
    .select("*, programmes(name, slug)")
    .eq("school_id", id);

  const { data: staff } = await supabase
    .from("user_roles")
    .select("*, profiles(display_name, email)")
    .eq("school_id", id)
    .is("revoked_at", null);

  return (
    <div>
      <a
        href="/admin/schools"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Back to schools
      </a>

      <div className="mt-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{school.name}</h1>
            <p className="text-sm opacity-70">
              {school.town}, {school.region}
            </p>
          </div>
          <span
            className={`rounded px-3 py-1 text-sm font-medium ${
              school.status === "approved"
                ? "bg-green-100 text-green-800"
                : school.status === "pending"
                  ? "bg-amber-100 text-amber-800"
                  : school.status === "declined"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {school.status}
          </span>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-theme border border-current/15 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Contact</h2>
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="opacity-60">Name</dt>
                <dd>{school.contact_name ?? "Not provided"}</dd>
              </div>
              <div>
                <dt className="opacity-60">Email</dt>
                <dd>{school.contact_email ?? "Not provided"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-theme border border-current/15 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">Programmes</h2>
            {schoolProgrammes && schoolProgrammes.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {schoolProgrammes.map((sp) => (
                  <li key={sp.id} className="flex items-center justify-between text-sm">
                    <span>
                      {(sp.programmes as unknown as { name: string })?.name ??
                        "Programme"}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        sp.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {sp.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm opacity-70">No programmes applied for.</p>
            )}
          </div>
        </div>

        {school.status === "pending" && (
          <div className="mt-8">
            <ApproveSchoolForm
              schoolId={school.id}
              schoolName={school.name}
            />
          </div>
        )}

        {staff && staff.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Staff</h2>
            <div className="mt-3 space-y-2">
              {staff.map((s) => (
                <div
                  key={s.id}
                  className="rounded-theme border border-current/15 bg-white p-3 text-sm"
                >
                  <span className="font-medium">
                    {(s.profiles as unknown as { display_name?: string })?.display_name ?? "Unknown"}
                  </span>
                  <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {s.role.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
