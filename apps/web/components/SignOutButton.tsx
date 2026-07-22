"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ displayName }: { displayName: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm opacity-70">{displayName}</span>
      <button
        onClick={handleSignOut}
        className="rounded-theme border border-current/20 px-4 py-2 text-sm hover:bg-red-50 hover:text-red-700"
      >
        Sign out
      </button>
    </div>
  );
}
