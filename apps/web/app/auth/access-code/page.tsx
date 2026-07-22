"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AccessCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Sign in anonymously with the access code
    // The access code is validated by a Supabase RPC or lookup
    const { data, error: queryError } = await supabase
      .from("invitations")
      .select("id, role, school_id, programme_id")
      .eq("access_code", code.trim().toUpperCase())
      .is("accepted_at", null)
      .gte("expires_at", new Date().toISOString())
      .single();

    if (queryError || !data) {
      setError("Access code not found or has expired. Please check and try again.");
      setLoading(false);
      return;
    }

    // If the user is already signed in, link the invitation
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      // Accept the invitation
      const { error: acceptError } = await supabase
        .from("invitations")
        .update({ accepted_at: new Date().toISOString(), accepted_by: sessionData.session.user.id })
        .eq("id", data.id);

      if (acceptError) {
        setError("Could not accept the invitation. Please contact support.");
        setLoading(false);
        return;
      }

      router.push(redirect);
      return;
    }

    // Sign in anonymously with email magic link flow but with the code in state
    // For access code participants who don't have email: use the code directly
    // This generates an anonymous session
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: `${code.trim().toLowerCase()}@access.sw.org.nz`,
      options: {
        shouldCreateUser: true,
        data: { access_code: code.trim().toUpperCase() },
      },
    });

    if (signInError) {
      // Fallback: use anonymous sign-in if available
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        setError(
          "Could not sign in with this access code. Please try again or contact your programme coordinator."
        );
      } else {
        // Accept the invitation for the anon user
        await supabase
          .from("invitations")
          .update({
            accepted_at: new Date().toISOString(),
            accepted_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq("id", data.id);

        router.push(redirect);
      }
    } else {
      router.push(redirect);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-wide opacity-70">
        Sport Waikato
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold text-primary">
        Use an access code
      </h1>
      <p className="mt-2 text-sm opacity-70">
        If your school or programme gave you a code, enter it below.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-theme border border-red-300 bg-red-50 p-4 text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="code" className="block text-sm font-medium">
            Access code
          </label>
          <input
            id="code"
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC-12345"
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-mono text-lg tracking-wider"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={loading || code.trim().length < 3}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Continue"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <button
          type="button"
          onClick={() => router.push("/auth/login")}
          className="font-medium text-primary underline hover:opacity-80"
        >
          Back to sign in
        </button>
      </p>
    </div>
  );
}

export default function AccessCodePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center">Loading...</div>}>
      <AccessCodeForm />
    </Suspense>
  );
}
