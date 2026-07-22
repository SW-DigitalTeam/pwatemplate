import { getUser } from "@/lib/supabase/server";
import Link from "next/link";
import { programmes } from "@sw/programme-config";

export default async function DashboardPage() {
  const user = await getUser();
  const firstName = user?.user_metadata?.display_name?.split(" ")[0] ?? user?.email;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">
        Kia ora{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="mt-2 opacity-70">
        Welcome to the Sport Waikato programme platform.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Your programmes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(programmes)
            .map((p) => (
              <Link
                key={p.slug}
                href={`/p/${p.slug}`}
                className="rounded-theme border border-current/15 p-5 hover:bg-primary hover:text-primary-contrast focus-visible:ring-2"
              >
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm opacity-80">{p.description.en}</p>
              </Link>
            ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/schools"
            className="rounded-theme border border-current/15 p-4 hover:bg-primary hover:text-primary-contrast"
          >
            <h3 className="font-medium">Schools</h3>
            <p className="text-sm opacity-70">View and manage schools</p>
          </Link>
          <Link
            href="/sessions"
            className="rounded-theme border border-current/15 p-4 hover:bg-primary hover:text-primary-contrast"
          >
            <h3 className="font-medium">Sessions</h3>
            <p className="text-sm opacity-70">Schedule and record sessions</p>
          </Link>
          <Link
            href="/surveys"
            className="rounded-theme border border-current/15 p-4 hover:bg-primary hover:text-primary-contrast"
          >
            <h3 className="font-medium">Surveys</h3>
            <p className="text-sm opacity-70">View and manage surveys</p>
          </Link>
          <Link
            href="/reports"
            className="rounded-theme border border-current/15 p-4 hover:bg-primary hover:text-primary-contrast"
          >
            <h3 className="font-medium">Reports</h3>
            <p className="text-sm opacity-70">Participation and movement</p>
          </Link>
          <Link
            href="/issues"
            className="rounded-theme border border-current/15 p-4 hover:bg-primary hover:text-primary-contrast"
          >
            <h3 className="font-medium">Issues</h3>
            <p className="text-sm opacity-70">Report equipment or problems</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
