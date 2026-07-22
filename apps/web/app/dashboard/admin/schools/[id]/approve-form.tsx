"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ApproveSchoolForm({
  schoolId,
  schoolName,
}: {
  schoolId: string;
  schoolName: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleAction(action: "approved" | "declined" | "info_requested") {
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("schools")
      .update({ status: action })
      .eq("id", schoolId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Update all school_programme applications too
    await supabase
      .from("school_programmes")
      .update({
        status: action,
        internal_notes: notes || null,
        decided_by: (await supabase.auth.getUser()).data.user?.id,
        decided_at: new Date().toISOString(),
      })
      .eq("school_id", schoolId);

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-theme border border-current/15 bg-white p-6">
      <h2 className="font-display text-lg font-semibold">Application review</h2>
      <p className="mt-1 text-sm opacity-70">
        Review the application for <strong>{schoolName}</strong>.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="mt-4">
        <label htmlFor="notes" className="block text-sm font-medium">
          Internal notes (visible to SW staff only)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about the application..."
          className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => handleAction("approved")}
          disabled={loading}
          className="rounded-theme bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 focus-visible:ring-2 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => handleAction("declined")}
          disabled={loading}
          className="rounded-theme border border-red-600 px-6 py-3 font-medium text-red-600 hover:bg-red-50 focus-visible:ring-2 disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => handleAction("info_requested")}
          disabled={loading}
          className="rounded-theme border border-current/20 px-6 py-3 font-medium hover:bg-amber-50 focus-visible:ring-2 disabled:opacity-50"
        >
          Request more info
        </button>
      </div>
    </div>
  );
}
