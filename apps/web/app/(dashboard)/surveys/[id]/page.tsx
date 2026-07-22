"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Question = {
  id: string;
  type: "single_choice" | "multiple_choice" | "rating" | "agreement" | "number" | "date" | "short_text" | "long_text" | "yes_no";
  label: string;
  required?: boolean;
  scale?: number;
  options?: string[];
};

type Section = {
  id: string;
  title: string;
  questions: Question[];
};

type SurveyDefinition = {
  sections: Section[];
};

export default function SurveyResponsePage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;
  const supabase = createClient();

  const [survey, setSurvey] = useState<Record<string, unknown> | null>(null);
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [responseId, setResponseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", surveyId)
        .eq("status", "published")
        .single();

      if (!data) {
        setError("Survey not found or not yet published.");
        setLoading(false);
        return;
      }

      setSurvey(data);

      // Check for existing in_progress response (save-and-resume)
      const { data: existing } = await supabase
        .from("survey_responses")
        .select("id, answers, status")
        .eq("survey_id", surveyId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        setResponseId(existing.id);
        setResponses((existing.answers as Record<string, string | string[]>) ?? {});
        setLastSaved(new Date());
      }

      setLoading(false);
    }
    load();
  }, [surveyId, supabase]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="opacity-70">Loading survey...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-primary underline hover:opacity-80"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">
          Thank you
        </h1>
        <p className="mt-4">Your responses have been recorded.</p>
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

  const definition = (survey as Record<string, unknown>)?.definition as SurveyDefinition;
  const sections = definition?.sections ?? [];

  function updateResponse(questionId: string, value: string | string[]) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleMultiOption(questionId: string, option: string) {
    setResponses((prev) => {
      const current = (prev[questionId] as string[]) ?? [];
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter((o) => o !== option) };
      }
      return { ...prev, [questionId]: [...current, option] };
    });
  }

  async function handleSave(resume: boolean) {
    setSaving(true);
    setError(null);

    if (resume) {
      // Save progress only — no validation
      const payload = {
        survey_id: surveyId,
        answers: responses,
        status: "in_progress",
      };

      if (responseId) {
        const { error: updateError } = await supabase
          .from("survey_responses")
          .update({ answers: responses })
          .eq("id", responseId)
          .eq("status", "in_progress");

        if (updateError) {
          setError(updateError.message);
        } else {
          setLastSaved(new Date());
        }
      } else {
        const { data, error: insertError } = await supabase
          .from("survey_responses")
          .insert(payload)
          .select("id")
          .single();

        if (insertError) {
          setError(insertError.message);
        } else if (data) {
          setResponseId(data.id);
          setLastSaved(new Date());
        }
      }
    } else {
      // Submit — validate required
      for (const section of sections) {
        for (const q of section.questions) {
          if (q.required && !responses[q.id]) {
            setError(`Please answer: "${q.label}"`);
            setSaving(false);
            return;
          }
          if (q.required && Array.isArray(responses[q.id]) && (responses[q.id] as string[]).length === 0) {
            setError(`Please select at least one option for: "${q.label}"`);
            setSaving(false);
            return;
          }
        }
      }

      const { error: submitError } = await supabase
        .from("survey_responses")
        .upsert({
          id: responseId,
          survey_id: surveyId,
          answers: responses,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        });

      if (submitError) {
        setError(submitError.message);
      } else {
        setSubmitted(true);
      }
    }

    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <a
        href="/dashboard"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Dashboard
      </a>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">
            {(survey as Record<string, unknown>)?.title as string}
          </h1>
        </div>
        {lastSaved && (
          <span className="rounded bg-green-50 px-3 py-1 text-xs text-green-700">
            Saved {lastSaved.toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <form className="mt-8 space-y-10">
        {sections.map((section) => (
          <fieldset key={section.id} className="space-y-6">
            <legend className="font-display text-lg font-semibold">
              {section.title}
            </legend>

            {section.questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <label
                  htmlFor={`q-${q.id}`}
                  className="block text-sm font-medium"
                >
                  {q.label}
                  {q.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>

                {q.type === "rating" && (
                  <div className="flex gap-2" role="radiogroup" aria-label={q.label}>
                    {Array.from({ length: q.scale ?? 5 }, (_, i) => i + 1).map(
                      (n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => updateResponse(q.id, String(n))}
                          className={`h-11 w-11 rounded border text-sm font-medium transition-colors ${
                            responses[q.id] === String(n)
                              ? "bg-primary text-primary-contrast border-primary"
                              : "border-current/20 bg-white hover:bg-primary/10"
                          }`}
                          aria-pressed={responses[q.id] === String(n)}
                        >
                          {n}
                        </button>
                      )
                    )}
                  </div>
                )}

                {q.type === "agreement" && (
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.label}>
                    {["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"].map(
                      (label, i) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => updateResponse(q.id, String(i + 1))}
                          className={`rounded border px-3 py-2 text-xs font-medium transition-colors ${
                            responses[q.id] === String(i + 1)
                              ? "bg-primary text-primary-contrast border-primary"
                              : "border-current/20 bg-white hover:bg-primary/10"
                          }`}
                          aria-pressed={responses[q.id] === String(i + 1)}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                )}

                {q.type === "single_choice" && q.options && (
                  <div className="space-y-2" role="radiogroup" aria-label={q.label}>
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-3 rounded border p-3 text-sm transition-colors ${
                          responses[q.id] === opt
                            ? "border-primary bg-primary/5 font-medium"
                            : "border-current/15 bg-white hover:bg-primary/5"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt}
                          checked={responses[q.id] === opt}
                          onChange={() => updateResponse(q.id, opt)}
                          className="h-4 w-4"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "multiple_choice" && q.options && (
                  <div className="space-y-2" role="group" aria-label={q.label}>
                    {q.options.map((opt) => {
                      const selected = (responses[q.id] as string[]) ?? [];
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-3 rounded border p-3 text-sm transition-colors ${
                            selected.includes(opt)
                              ? "border-primary bg-primary/5 font-medium"
                              : "border-current/15 bg-white hover:bg-primary/5"
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={opt}
                            checked={selected.includes(opt)}
                            onChange={() => toggleMultiOption(q.id, opt)}
                            className="h-4 w-4 rounded"
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.type === "yes_no" && (
                  <div className="flex gap-3" role="radiogroup" aria-label={q.label}>
                    {["Yes", "No"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateResponse(q.id, opt)}
                        className={`rounded border px-5 py-2.5 text-sm font-medium transition-colors ${
                          responses[q.id] === opt
                            ? "bg-primary text-primary-contrast border-primary"
                            : "border-current/20 bg-white hover:bg-primary/10"
                        }`}
                        aria-pressed={responses[q.id] === opt}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "number" && (
                  <input
                    id={`q-${q.id}`}
                    type="number"
                    value={(responses[q.id] as string) ?? ""}
                    onChange={(e) => updateResponse(q.id, e.target.value)}
                    className="block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
                  />
                )}

                {q.type === "date" && (
                  <input
                    id={`q-${q.id}`}
                    type="date"
                    value={(responses[q.id] as string) ?? ""}
                    onChange={(e) => updateResponse(q.id, e.target.value)}
                    className="block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
                  />
                )}

                {q.type === "short_text" && (
                  <input
                    id={`q-${q.id}`}
                    type="text"
                    value={(responses[q.id] as string) ?? ""}
                    onChange={(e) => updateResponse(q.id, e.target.value)}
                    className="block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
                  />
                )}

                {q.type === "long_text" && (
                  <textarea
                    id={`q-${q.id}`}
                    rows={4}
                    value={(responses[q.id] as string) ?? ""}
                    onChange={(e) => updateResponse(q.id, e.target.value)}
                    className="block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
                  />
                )}
              </div>
            ))}
          </fieldset>
        ))}

        {error && (
          <div role="alert" className="rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 rounded-theme border border-current/20 px-5 py-4 text-center font-medium hover:bg-primary/10 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save progress"}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit survey"}
          </button>
        </div>
      </form>
    </div>
  );
}
