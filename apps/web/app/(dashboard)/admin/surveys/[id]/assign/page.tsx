"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AssignSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;
  const supabase = createClient();

  const [survey, setSurvey] = useState<Record<string, unknown> | null>(null);
  const [schoolProgrammes, setSchoolProgrammes] = useState<
    Array<{ id: string; school: { name: string }; programme: { name: string } }>
  >([]);
  const [selectedSp, setSelectedSp] = useState("");
  const [cohorts, setCohorts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignments, setAssignments] = useState<
    Array<{ id: string; school: string; cohort: string; due_at: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from("surveys")
        .select("id, title, key, programmes(name)")
        .eq("id", surveyId)
        .single();

      if (!s) {
        setError("Survey not found.");
        setLoading(false);
        return;
      }
      setSurvey(s);

      // Get school_programmes for this survey's programme
      const { data: sps } = await supabase
        .from("school_programmes")
        .select("id, schools(name), programmes(name)")
        .eq("status", "approved");

      const filtered = (sps ?? []).filter(
        (sp) =>
          (sp.programmes as unknown as { name: string })?.name ===
          (s.programmes as unknown as { name: string })?.name
      );

      setSchoolProgrammes(
        filtered.map((sp) => ({
          id: sp.id,
          school: sp.schools as unknown as { name: string },
          programme: sp.programmes as unknown as { name: string },
        }))
      );

      // Load existing assignments
      const { data: assigns } = await supabase
        .from("survey_assignments")
        .select("id, due_at, school_programmes(schools(name)), cohorts(name)")
        .eq("survey_id", surveyId);

      setAssignments(
        (assigns ?? []).map((a) => ({
          id: a.id,
          school:
            (a.school_programmes as unknown as { schools: { name: string } })
              ?.schools?.name ?? "Unknown",
          cohort:
            (a.cohorts as unknown as { name: string })?.name ?? "All groups",
          due_at: a.due_at,
        }))
      );

      setLoading(false);
    }
    load();
  }, [surveyId, supabase]);

  useEffect(() => {
    async function loadCohorts() {
      if (!selectedSp) return;
      const { data } = await supabase
        .from("cohorts")
        .select("id, name")
        .eq("school_programme_id", selectedSp)
        .order("name");
      setCohorts(data ?? []);
    }
    loadCohorts();
  }, [selectedSp, supabase]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("survey_assignments")
      .insert({
        survey_id: surveyId,
        school_programme_id: selectedSp,
        cohort_id: selectedCohort || null,
        due_at: dueDate || null,
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
      // Refresh assignments
      const { data: assigns } = await supabase
        .from("survey_assignments")
        .select("id, due_at, school_programmes(schools(name)), cohorts(name)")
        .eq("survey_id", surveyId);

      setAssignments(
        (assigns ?? []).map((a) => ({
          id: a.id,
          school:
            (a.school_programmes as unknown as { schools: { name: string } })
              ?.schools?.name ?? "Unknown",
          cohort:
            (a.cohorts as unknown as { name: string })?.name ?? "All groups",
          due_at: a.due_at,
        }))
      );
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="opacity-70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <a
        href="/admin/surveys"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Back to surveys
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Assign: {(survey as Record<string, unknown>)?.title as string}
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mt-4 rounded-theme border border-green-300 bg-green-50 p-4 text-sm text-green-800"
        >
          Survey assigned successfully.
        </div>
      )}

      <form onSubmit={handleAssign} className="mt-8 space-y-5">
        <div>
          <label htmlFor="school" className="block text-sm font-medium">
            School <span className="text-red-500">*</span>
          </label>
          <select
            id="school"
            required
            value={selectedSp}
            onChange={(e) => setSelectedSp(e.target.value)}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          >
            <option value="">Select a school...</option>
            {schoolProgrammes.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.school.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cohort" className="block text-sm font-medium">
            Group (optional — leave blank for all groups)
          </label>
          <select
            id="cohort"
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
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

        <div>
          <label htmlFor="due" className="block text-sm font-medium">
            Due date (optional)
          </label>
          <input
            id="due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !selectedSp}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Assigning..." : "Assign survey"}
        </button>
      </form>

      {assignments.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">
            Current assignments
          </h2>
          <div className="mt-3 space-y-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-theme border border-current/15 bg-white p-4 text-sm"
              >
                <div>
                  <span className="font-medium">{a.school}</span>
                  <span className="ml-2 opacity-60">{a.cohort}</span>
                </div>
                {a.due_at && (
                  <span className="text-xs opacity-60">
                    Due {new Date(a.due_at).toLocaleDateString("en-NZ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
