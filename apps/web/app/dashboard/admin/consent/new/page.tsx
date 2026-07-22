"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

function ConsentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const supabase = createClient();

  const [programmeId, setProgrammeId] = useState("");
  const [programmes, setProgrammes] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [version, setVersion] = useState("v1");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        const { data: cv } = await supabase
          .from("consent_versions")
          .select("*")
          .eq("id", editId)
          .single();
        if (cv) {
          setProgrammeId(cv.programme_id);
          setVersion(cv.version);
          setTitle(cv.title);
          setContent(cv.content_md);
        }
      }
    }
    load();
  }, [editId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (editId) {
      // Editing creates a new version
      const { data: existing } = await supabase
        .from("consent_versions")
        .select("version")
        .eq("programme_id", programmeId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      const newVersion = existing
        ? `v${parseInt(existing.version.replace("v", "")) + 1}`
        : "v1";

      const { error: insertError } = await supabase
        .from("consent_versions")
        .insert({
          programme_id: programmeId,
          version: newVersion,
          title,
          content_md: content,
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess(true);
      }
    } else {
      const { error: insertError } = await supabase
        .from("consent_versions")
        .insert({
          programme_id: programmeId,
          version,
          title,
          content_md: content,
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
          {editId ? "New version created" : "Permission form created"}
        </h1>
        <button
          onClick={() => router.push("/dashboard/admin/consent")}
          className="mt-6 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Back to permission forms
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <a
        href="/dashboard/admin/consent"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Back to permission forms
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        {editId ? "Edit permission form" : "Create permission form"}
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
            <label htmlFor="version" className="block text-sm font-medium">
              Version
            </label>
            <input
              id="version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v1"
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
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
              placeholder="e.g. Programme participation consent"
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium">
            Consent text <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            rows={12}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the consent information here. This is what participants or caregivers read and agree to.&#10;&#10;Use clear, plain language. Explain:&#10;- What the programme involves&#10;- What data will be collected&#10;- How data will be used&#10;- How to withdraw consent&#10;- Who to contact with questions"
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : editId
              ? "Save as new version"
              : "Create permission form"}
        </button>
      </form>
    </div>
  );
}

export default function NewConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl py-16 text-center">Loading...</div>
      }
    >
      <ConsentForm />
    </Suspense>
  );
}
