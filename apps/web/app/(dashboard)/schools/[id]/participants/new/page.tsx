"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EnrolParticipantPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [cohorts, setCohorts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: sps } = await supabase
        .from("school_programmes")
        .select("id")
        .eq("school_id", schoolId);

      if (!sps || sps.length === 0) return;

      const spIds = sps.map((sp) => sp.id);
      const { data } = await supabase
        .from("cohorts")
        .select("id, name")
        .in("school_programme_id", spIds)
        .order("name");

      setCohorts(data ?? []);
    }
    load();
  }, [schoolId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Create participant
    const { data: participant, error: pError } = await supabase
      .from("participants")
      .insert({
        school_id: schoolId,
        display_name: displayName,
        year_level: yearLevel || null,
        access_method: "managed",
        accessibility_notes: accessNotes || null,
        status: "enrolled",
      })
      .select("id")
      .single();

    if (pError || !participant) {
      setError(pError?.message ?? "Could not enrol participant.");
      setLoading(false);
      return;
    }

    // Enrol in a programme
    const { data: sp } = await supabase
      .from("school_programmes")
      .select("id")
      .eq("school_id", schoolId)
      .eq("status", "approved")
      .limit(1)
      .single();

    if (sp) {
      await supabase.from("enrolments").insert({
        participant_id: participant.id,
        school_programme_id: sp.id,
        cohort_id: cohortId || null,
        status: "enrolled",
        started_at: new Date().toISOString().split("T")[0],
      });
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">
          Participant enrolled
        </h1>
        <p className="mt-4">
          <strong>{displayName}</strong> has been added.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setDisplayName("");
            setYearLevel("");
            setAccessNotes("");
          }}
          className="mt-6 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Enrol another participant
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <a
        href={`/schools/${schoolId}`}
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; School dashboard
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Enrol a participant
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium">
            First name or preferred name <span className="text-red-500">*</span>
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          />
        </div>

        <div>
          <label htmlFor="yearLevel" className="block text-sm font-medium">
            Year level (optional)
          </label>
          <select
            id="yearLevel"
            value={yearLevel}
            onChange={(e) => setYearLevel(e.target.value)}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          >
            <option value="">Not specified</option>
            <option value="Y1">Year 1</option>
            <option value="Y2">Year 2</option>
            <option value="Y3">Year 3</option>
            <option value="Y4">Year 4</option>
            <option value="Y5">Year 5</option>
            <option value="Y6">Year 6</option>
            <option value="Y7">Year 7</option>
            <option value="Y8">Year 8</option>
            <option value="Y9">Year 9</option>
            <option value="Y10">Year 10</option>
            <option value="Y11">Year 11</option>
            <option value="Y12">Year 12</option>
            <option value="Y13">Year 13</option>
          </select>
        </div>

        <div>
          <label htmlFor="cohort" className="block text-sm font-medium">
            Group (optional)
          </label>
          <select
            id="cohort"
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          >
            <option value="">No group assigned</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="accessNotes" className="block text-sm font-medium">
            Accessibility or support notes (optional)
          </label>
          <textarea
            id="accessNotes"
            rows={2}
            value={accessNotes}
            onChange={(e) => setAccessNotes(e.target.value)}
            placeholder="Anything facilitators should know to support this participant"
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !displayName.trim()}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {loading ? "Enrolling..." : "Enrol participant"}
        </button>
      </form>
    </div>
  );
}
