"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(errorParam);
  const supabase = createClient();

  // Check if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });
  }, [router, supabase]);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleMagicLinkSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a sign-in link. It may take a minute to arrive.");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-wide opacity-70">
        Sport Waikato
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold text-primary">
        Sign in
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-theme border border-red-300 bg-red-50 p-4 text-red-800"
        >
          {error === "access_denied"
            ? "Sign-in was cancelled. Please try again."
            : error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mt-6 rounded-theme border border-green-300 bg-green-50 p-4 text-green-800"
        >
          {message}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-theme border border-current/20 bg-white px-5 py-4 font-medium hover:bg-primary hover:text-primary-contrast focus-visible:ring-2 disabled:opacity-50"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-current/15" />
          <span className="text-sm opacity-60">or use email</span>
          <div className="flex-1 border-t border-current/15" />
        </div>

        <form onSubmit={handleMagicLinkSignIn}>
          <label
            htmlFor="email"
            className="block text-sm font-medium"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.co.nz"
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="mt-4 w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
          >
            {loading ? "Sending link..." : "Send magic link"}
          </button>
        </form>

        <p className="text-center text-sm">
          <span className="opacity-70">Don&apos;t have an account? </span>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/auth/signup?redirect=${encodeURIComponent(redirect)}`
              )
            }
            className="font-medium text-primary underline hover:opacity-80"
          >
            Create one
          </button>
        </p>

        <p className="text-center text-sm">
          <span className="opacity-70">Signing in for a programme? </span>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/auth/access-code?redirect=${encodeURIComponent(redirect)}`
              )
            }
            className="font-medium text-primary underline hover:opacity-80"
          >
            Use an access code
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
