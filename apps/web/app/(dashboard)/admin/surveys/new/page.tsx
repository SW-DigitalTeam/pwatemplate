"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "rating"
  | "agreement"
  | "number"
  | "date"
  | "short_text"
  | "long_text"
  | "yes_no";

type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  scale?: number;
  options?: string[];
};

type Section = {
  id: string;
  title: string;
  questions: Question[];
};

const QUESTION_TYPES: Array<{ value: QuestionType; label: string }> = [
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "rating", label: "Rating scale (1-5)" },
  { value: "agreement", label: "Agreement scale" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "yes_no", label: "Yes / No" },
];

function SurveyBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [key, setKey] = useState("");
  const [anonymity, setAnonymity] = useState("pseudonymous");
  const [status, setStatus] = useState("draft");
  const [programmeId, setProgrammeId] = useState("");
  const [programmes, setProgrammes] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [sections, setSections] = useState<Section[]>([
    { id: "s1", title: "Section 1", questions: [] },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: progs } = await supabase
        .from("programmes")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      setProgrammes(progs ?? []);
      if (progs && progs.length > 0 && progs[0]) setProgrammeId(progs[0].id);

      if (editId) {
        const { data: survey } = await supabase
          .from("surveys")
          .select("*")
          .eq("id", editId)
          .single();

        if (survey) {
          setTitle(survey.title);
          setKey(survey.key);
          setAnonymity(survey.anonymity);
          setStatus(survey.status);
          setProgrammeId(survey.programme_id);
          setSections(survey.definition?.sections ?? []);
          setIsEditing(true);
        }
      }
    }
    load();
  }, [editId, supabase]);

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: `s${prev.length + 1}`, title: `Section ${prev.length + 1}`, questions: [] },
    ]);
  }

  function addQuestion(sectionIdx: number) {
    const newQ: Question = {
      id: `q${Date.now()}`,
      type: "short_text",
      label: "",
      required: false,
    };
    setSections((prev) => {
      const next = [...prev];
      next[sectionIdx]!.questions.push(newQ);
      return next;
    });
  }

  function updateQuestion(
    sectionIdx: number,
    questionIdx: number,
    updates: Partial<Question>
  ) {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIdx]!.questions[questionIdx] = {
        ...next[sectionIdx]!.questions[questionIdx]!,
        ...updates,
      };
      return next;
    });
  }

  function removeQuestion(sectionIdx: number, questionIdx: number) {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIdx]!.questions.splice(questionIdx, 1);
      return next;
    });
  }

  function updateSectionTitle(sectionIdx: number, title: string) {
    setSections((prev) => {
      const next = [...prev];
      next[sectionIdx]!.title = title;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    for (const section of sections) {
      for (const q of section.questions) {
        if (!q.label.trim()) {
          setError("All questions must have a label.");
          setLoading(false);
          return;
        }
        if (
          (q.type === "single_choice" || q.type === "multiple_choice") &&
          (!q.options || q.options.length === 0)
        ) {
          setError(`"${q.label}" needs at least one option.`);
          setLoading(false);
          return;
        }
      }
    }

    const definition = { sections };
    const slug = key || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    if (isEditing && editId) {
      // Editing a published survey creates a new version
      const { data: existing } = await supabase
        .from("surveys")
        .select("version")
        .eq("id", editId)
        .single();

      const newVersion = (existing?.version ?? 0) + 1;

      // Create new version
      const { error: insertError } = await supabase.from("surveys").insert({
        programme_id: programmeId,
        key: slug,
        title,
        version: newVersion,
        definition,
        anonymity,
        status: "draft", // new version starts as draft
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        // Close the old version
        await supabase
          .from("surveys")
          .update({ status: "closed" })
          .eq("id", editId);
        setSuccess(true);
      }
    } else {
      const { error: insertError } = await supabase.from("surveys").insert({
        programme_id: programmeId,
        key: slug,
        title,
        version: 1,
        definition,
        anonymity,
        status,
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess(true);
      }
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">
          {isEditing ? "New version created" : "Survey created"}
        </h1>
        <p className="mt-4">
          {isEditing
            ? `A new version of "${title}" has been created as a draft.`
            : `"${title}" has been created.`}
        </p>
        <button
          onClick={() => router.push("/admin/surveys")}
          className="mt-6 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Back to surveys
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <a
        href="/admin/surveys"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Back to surveys
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        {isEditing ? `Edit: ${title}` : "Create a survey"}
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Survey metadata */}
        <fieldset className="space-y-4 rounded-theme border border-current/15 bg-white p-6">
          <legend className="font-display text-lg font-semibold">
            Survey details
          </legend>

          <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder="e.g. Baseline survey"
                className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
              />
            </div>
            <div>
              <label htmlFor="key" className="block text-sm font-medium">
                Key (auto-generated from title)
              </label>
              <input
                id="key"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="baseline"
                className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="programme" className="block text-sm font-medium">
                Programme <span className="text-red-500">*</span>
              </label>
              <select
                id="programme"
                value={programmeId}
                onChange={(e) => setProgrammeId(e.target.value)}
                className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
              >
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="anonymity" className="block text-sm font-medium">
                Anonymity
              </label>
              <select
                id="anonymity"
                value={anonymity}
                onChange={(e) => setAnonymity(e.target.value)}
                className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
              >
                <option value="identified">Identified</option>
                <option value="pseudonymous">Pseudonymous</option>
                <option value="anonymous">Anonymous</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Sections and questions */}
        {sections.map((section, sIdx) => (
          <fieldset
            key={section.id}
            className="space-y-4 rounded-theme border border-current/15 bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                className="flex-1 rounded-theme border border-current/20 bg-white px-4 py-2 font-display text-lg font-semibold"
                aria-label={`Section ${sIdx + 1} title`}
              />
              <button
                type="button"
                onClick={() => addQuestion(sIdx)}
                className="rounded-theme bg-primary px-4 py-2 text-sm font-medium text-primary-contrast hover:opacity-90"
              >
                + Add question
              </button>
            </div>

            {section.questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="space-y-3 rounded-theme border border-current/10 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase opacity-50">
                    Question {qIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeQuestion(sIdx, qIdx)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium">
                      Question <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={q.label}
                      onChange={(e) =>
                        updateQuestion(sIdx, qIdx, { label: e.target.value })
                      }
                      placeholder="Enter question text..."
                      className="mt-1 block w-full rounded border border-current/20 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Type</label>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(sIdx, qIdx, {
                          type: e.target.value as QuestionType,
                          options: undefined,
                        })
                      }
                      className="mt-1 block w-full rounded border border-current/20 bg-white px-3 py-2 text-sm"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(q.type === "single_choice" || q.type === "multiple_choice") && (
                  <div>
                    <label className="block text-sm font-medium">
                      Options (one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={(q.options ?? []).join("\n")}
                      onChange={(e) =>
                        updateQuestion(sIdx, qIdx, {
                          options: e.target.value
                            .split("\n")
                            .filter((s) => s.trim()),
                        })
                      }
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      className="mt-1 block w-full rounded border border-current/20 bg-white px-3 py-2 text-sm font-mono"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) =>
                      updateQuestion(sIdx, qIdx, { required: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span className="text-sm">Required</span>
                </label>
              </div>
            ))}

            {section.questions.length === 0 && (
              <p className="text-center text-sm opacity-50">
                No questions yet. Click &quot;Add question&quot; to start.
              </p>
            )}
          </fieldset>
        ))}

        <button
          type="button"
          onClick={addSection}
          className="w-full rounded-theme border-2 border-dashed border-current/20 p-4 text-sm font-medium opacity-70 hover:opacity-100"
        >
          + Add section
        </button>

        <button
          type="submit"
          disabled={loading || !title.trim() || sections.every((s) => s.questions.length === 0)}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEditing
              ? "Save as new version"
              : "Create survey"}
        </button>
      </form>
    </div>
  );
}

export default function NewSurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl py-16 text-center">Loading...</div>
      }
    >
      <SurveyBuilder />
    </Suspense>
  );
}
