"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PrivacyRequestPage() {
  const router = useRouter();
  const supabase = createClient();
  const [type, setType] = useState("data_deletion");
  const [detail, setDetail] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!confirmName.trim()) {
      setError("Please confirm your name.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("issues").insert({
      category: "data_quality",
      severity: "medium",
      title: `Privacy request: ${type.replace(/_/g, " ")}`,
      detail: `Request type: ${type}\nConfirming name: ${confirmName}\n\nAdditional details:\n${detail}`,
      status: "open",
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
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">Request submitted</h1>
        <p className="mt-4">
          Your privacy request has been submitted. The Sport Waikato team will process it within 20
          working days, as required by the Privacy Act 2020. You will receive confirmation by email
          if your account has an email address.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <a href="/dashboard" className="text-sm text-primary underline hover:opacity-80">
        &larr; Dashboard
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">Privacy request</h1>
      <p className="mt-2 text-sm opacity-70">
        Under the Privacy Act 2020, you have the right to request access to your data, correction of
        your data, or deletion of your data. Sport Waikato will respond within 20 working days.
      </p>

      {error && (
        <div role="alert" className="mt-6 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Request type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          >
            <option value="data_deletion">Delete my data</option>
            <option value="data_access">Access my data</option>
            <option value="data_correction">Correct my data</option>
            <option value="withdrawal">Withdraw from all programmes</option>
          </select>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium">
            Your full name <span className="text-red-500">*</span>
          </label>
          <input
            id="confirm"
            type="text"
            required
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Confirm your full name"
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          />
        </div>

        <div>
          <label htmlFor="detail" className="block text-sm font-medium">
            Additional details
          </label>
          <textarea
            id="detail"
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Any additional information about your request — which programmes, what data you would like deleted or accessed, etc."
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
          />
        </div>

        <div className="rounded-theme border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">What happens next</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Your request is recorded with a timestamp for accountability.</li>
            <li>A Sport Waikato team member reviews the request.</li>
            <li>You will receive a confirmation within 20 working days.</li>
            <li>Deleted data cannot be recovered. De-identified aggregate data may be retained for programme evaluation.</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading || !confirmName.trim()}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit privacy request"}
        </button>
      </form>
    </div>
  );
}
