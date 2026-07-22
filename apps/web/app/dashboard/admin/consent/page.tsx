import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserRoles } from "@/lib/supabase/server";

export default async function AdminConsentPage() {
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

  const { data: consentVersions } = await supabase
    .from("consent_versions")
    .select("id, version, title, content_md, effective_from, created_at, programmes(name, slug)")
    .order("created_at", { ascending: false });

  const { data: consentCounts } = await supabase
    .from("consents")
    .select("consent_version_id, withdrawn_at");

  const consentStats = new Map<string, { granted: number; withdrawn: number }>();
  for (const c of consentCounts ?? []) {
    const existing = consentStats.get(c.consent_version_id) ?? {
      granted: 0,
      withdrawn: 0,
    };
    existing.granted++;
    if (c.withdrawn_at) existing.withdrawn++;
    consentStats.set(c.consent_version_id, existing);
  }

  const grouped = new Map<string, typeof consentVersions>();
  for (const cv of consentVersions ?? []) {
    const slug = (cv.programmes as unknown as { slug: string })?.slug ?? "unknown";
    if (!grouped.has(slug)) grouped.set(slug, []);
    grouped.get(slug)!.push(cv);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Permission forms</h1>
        <a
          href="/dashboard/admin/consent/new"
          className="rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Create form
        </a>
      </div>

      <p className="mt-2 text-sm opacity-70">
        Manage consent and permission forms for each programme. Each programme
        has its own consent text that participants or caregivers agree to.
      </p>

      {Array.from(grouped.entries()).map(([slug, versions]) => (
        <section key={slug} className="mt-10">
          <h2 className="font-display text-xl font-semibold">
            {(versions?.[0]?.programmes as unknown as { name: string })?.name ??
              slug}
          </h2>
          <div className="mt-4 space-y-3">
            {versions?.map((cv) => {
              const stats = consentStats.get(cv.id);
              return (
                <div
                  key={cv.id}
                  className="rounded-theme border border-current/15 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">
                        {cv.title}{" "}
                        <span className="text-sm font-normal opacity-60">
                          v{cv.version}
                        </span>
                      </h3>
                      <p className="mt-1 text-sm opacity-70">
                        Effective from{" "}
                        {new Date(cv.effective_from).toLocaleDateString("en-NZ")}
                      </p>
                      {stats && (
                        <p className="mt-2 text-sm">
                          <span className="font-medium text-green-700">
                            {stats.granted} granted
                          </span>
                          {stats.withdrawn > 0 && (
                            <>
                              {" · "}
                              <span className="text-red-700">
                                {stats.withdrawn} withdrawn
                              </span>
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/admin/consent/${cv.id}`}
                        className="rounded-theme border border-current/20 px-3 py-2 text-sm hover:bg-primary hover:text-primary-contrast"
                      >
                        View / Edit
                      </a>
                    </div>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-primary">
                      Preview content
                    </summary>
                    <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm">
                      {cv.content_md}
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
