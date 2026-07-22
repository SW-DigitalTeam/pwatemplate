import { redirect } from "next/navigation";
import { getUser, getProfile, getUserRoles } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/auth/login?redirect=/dashboard");

  const profile = await getProfile(user.id);
  const roles = await getUserRoles(user.id);

  return (
    <div className="min-h-dvh">
      <nav className="border-b border-current/10 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="font-display text-lg font-bold text-primary"
            >
              Sport Waikato
            </a>
            <span className="hidden rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline">
              {roles[0]?.role?.replace(/_/g, " ") ?? "User"}
            </span>
          </div>
          <SignOutButton
            displayName={profile?.display_name ?? user.email ?? "User"}
          />
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
