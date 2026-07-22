"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function NewIssueForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("school_id");
  const supabase = createClient();

  const [category, setCategory] = useState("equipment");
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("issues").insert({
      school_id: schoolId || null,
      category,
      severity,
      title,
      detail: detail || null,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">
          Issue reported
        </h1>
        <p className="mt-4">
          Thank you. The Sport Waikato team will look into it.
        </p>
        {category === "safeguarding" && (
          <p className="mt-4 rounded bg-amber-50 p-4 text-sm text-amber-800">
            Safeguarding concerns are reviewed by our programme team. If this is
            urgent, please also contact your programme lead directly.
          </p>
        )}
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <a
        href="/dashboard"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Dashboard
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Report an issue
      </h1>
      <p className="mt-2 text-sm opacity-70">
        Report equipment problems, technical issues, data concerns or
        safeguarding matters.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className="block text-sm font-medium">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            >
              <option value="equipment">Equipment</option>
              <option value="bug">Technical bug</option>
              <option value="data_quality">Data quality</option>
              <option value="accessibility">Accessibility</option>
              <option value="safeguarding">Safeguarding concern</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="severity" className="block text-sm font-medium">
              Severity
            </label>
            <select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          />
        </div>

        <div>
          <label htmlFor="detail" className="block text-sm font-medium">
            Details
          </label>
          <textarea
            id="detail"
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="What happened? What did you expect? Any steps to reproduce?"
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit issue"}
        </button>
      </form>
    </div>
  );
}

export default function NewIssuePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg py-16 text-center">Loading...</div>
      }
    >
      <NewIssueForm />
    </Suspense>
  );
}
