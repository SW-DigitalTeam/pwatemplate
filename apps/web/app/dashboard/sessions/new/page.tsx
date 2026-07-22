"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function NewSessionForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const schoolId = (params.id as string) ?? searchParams.get("school_id") ?? "";
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState("lunchtime");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [durationMinutes, setDurationMinutes] = useState(40);
  const [schoolProgrammeId, setSchoolProgrammeId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [schoolProgrammes, setSchoolProgrammes] = useState<
    Array<{ id: string; programme: { name: string } }>
  >([]);
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      if (!schoolId) return;

      const { data: sps } = await supabase
        .from("school_programmes")
        .select("id, programmes(name)")
        .eq("school_id", schoolId)
        .eq("status", "approved");

      const spData = (sps ?? []).map((sp) => ({
        id: sp.id,
        programme: sp.programmes as unknown as { name: string },
      }));
      setSchoolProgrammes(spData);

      if (spData.length > 0 && spData[0]) {
        const firstSpId = spData[0].id;
        setSchoolProgrammeId(firstSpId);

        const { data: cohortData } = await supabase
          .from("cohorts")
          .select("id, name")
          .eq("school_programme_id", firstSpId)
          .order("name");
        setCohorts(cohortData ?? []);
      }
    }
    load();
  }, [schoolId, supabase]);

  useEffect(() => {
    async function loadCohorts() {
      if (!schoolProgrammeId) return;
      const { data } = await supabase
        .from("cohorts")
        .select("id, name")
        .eq("school_programme_id", schoolProgrammeId)
        .order("name");
      setCohorts(data ?? []);
    }
    loadCohorts();
  }, [schoolProgrammeId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const scheduledAt = new Date(
      `${scheduledDate}T${scheduledTime}:00`
    ).toISOString();

    const { error: insertError } = await supabase.from("sessions").insert({
      school_programme_id: schoolProgrammeId,
      cohort_id: cohortId || null,
      title,
      session_type: sessionType,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      status: "scheduled",
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
          Session scheduled
        </h1>
        <p className="mt-4">{title || `${sessionType} session`} has been created.</p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setTitle("");
          }}
          className="mt-6 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Schedule another
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8">
      <a
        href={schoolId ? `/schools/${schoolId}` : "/dashboard"}
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Back
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Schedule a session
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
          <label htmlFor="title" className="block text-sm font-medium">
            Session title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lunchtime movement"
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          >
            <option value="lunchtime">Lunchtime</option>
            <option value="before_school">Before school</option>
            <option value="after_school">After school</option>
            <option value="class">During class</option>
            <option value="workshop">Workshop</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="block text-sm font-medium">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm font-medium">
              Time
            </label>
            <input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
          </div>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium">
            Duration (minutes)
          </label>
          <input
            id="duration"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            min={5}
            max={480}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          />
        </div>

        {schoolProgrammes.length > 0 && (
          <div>
            <label htmlFor="programme" className="block text-sm font-medium">
              Programme
            </label>
            <select
              id="programme"
              value={schoolProgrammeId}
              onChange={(e) => setSchoolProgrammeId(e.target.value)}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            >
              {schoolProgrammes.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.programme.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {cohorts.length > 0 && (
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
              <option value="">All groups</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !scheduledDate || !schoolProgrammeId}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {loading ? "Scheduling..." : "Schedule session"}
        </button>
      </form>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg py-16 text-center">Loading...</div>
      }
    >
      <NewSessionForm />
    </Suspense>
  );
}
