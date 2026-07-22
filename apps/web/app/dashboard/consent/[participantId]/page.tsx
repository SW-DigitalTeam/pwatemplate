"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ConsentVersion = {
  id: string;
  version: string;
  title: string;
  content_md: string;
};

type ExistingConsent = {
  id: string;
  granted_at: string;
  withdrawn_at: string | null;
  granted_by_name: string;
  granted_by_relationship: string;
};

export default function ConsentPage() {
  const params = useParams();
  const router = useRouter();
  const participantId = params.participantId as string;
  const supabase = createClient();

  const [participant, setParticipant] = useState<{
    display_name: string;
    school_id: string;
  } | null>(null);
  const [programmes, setProgrammes] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [consentVersions, setConsentVersions] = useState<ConsentVersion[]>([]);
  const [existingConsents, setExistingConsents] = useState<ExistingConsent[]>(
    []
  );
  const [formData, setFormData] = useState({
    granted_by_name: "",
    granted_by_relationship: "",
    agreeTerms: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      // Load participant
      const { data: p } = await supabase
        .from("participants")
        .select("display_name, school_id")
        .eq("id", participantId)
        .single();

      if (!p) {
        setError("Participant not found.");
        setLoading(false);
        return;
      }
      setParticipant(p);

      // Load school programmes
      const { data: sps } = await supabase
        .from("school_programmes")
        .select("id, programmes(id, name, slug)")
        .eq("school_id", p.school_id)
        .eq("status", "approved");

      const progs = (sps ?? []).map((sp) => {
        const prog = sp.programmes as unknown as {
          id: string;
          name: string;
          slug: string;
        };
        return prog;
      });
      setProgrammes(progs);
      if (progs.length > 0 && progs[0]) setSelectedProgramme(progs[0].id);

      // Load existing consents
      const { data: consents } = await supabase
        .from("consents")
        .select("id, granted_at, withdrawn_at, granted_by_name, granted_by_relationship, consent_versions(version)")
        .eq("participant_id", participantId)
        .order("granted_at", { ascending: false });

      setExistingConsents(
        (consents ?? []).map((c) => ({
          id: c.id,
          granted_at: c.granted_at,
          withdrawn_at: c.withdrawn_at,
          granted_by_name: c.granted_by_name,
          granted_by_relationship: c.granted_by_relationship,
        }))
      );

      setLoading(false);
    }
    load();
  }, [participantId, supabase]);

  useEffect(() => {
    async function loadVersions() {
      if (!selectedProgramme) return;
      const { data } = await supabase
        .from("consent_versions")
        .select("id, version, title, content_md")
        .eq("programme_id", selectedProgramme)
        .order("version", { ascending: false });

      setConsentVersions(data ?? []);
    }
    loadVersions();
  }, [selectedProgramme, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!formData.granted_by_name.trim()) {
      setError("Please enter your name as the consenting person.");
      setSaving(false);
      return;
    }

    if (!formData.agreeTerms) {
      setError("You must agree to the terms to give consent.");
      setSaving(false);
      return;
    }

    const version = consentVersions[0];
    if (!version) {
      setError("No consent version available for this programme.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("consents").insert({
      participant_id: participantId,
      programme_id: selectedProgramme,
      consent_version_id: version.id,
      granted_by_name: formData.granted_by_name,
      granted_by_relationship: formData.granted_by_relationship || "caregiver",
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
    }
    setSaving(false);
  }

  async function handleWithdraw(consentId: string) {
    setSaving(true);
    const { error: withdrawError } = await supabase
      .from("consents")
      .update({
        withdrawn_at: new Date().toISOString(),
        withdrawal_reason: "Withdrawn by caregiver",
      })
      .eq("id", consentId);

    if (withdrawError) {
      setError(withdrawError.message);
    } else {
      // Refresh
      const { data } = await supabase
        .from("consents")
        .select("id, granted_at, withdrawn_at, granted_by_name, granted_by_relationship")
        .eq("participant_id", participantId)
        .order("granted_at", { ascending: false });

      setExistingConsents(
        (data ?? []).map((c) => ({
          id: c.id,
          granted_at: c.granted_at,
          withdrawn_at: c.withdrawn_at,
          granted_by_name: c.granted_by_name,
          granted_by_relationship: c.granted_by_relationship,
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

  if (success) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">
          Consent recorded
        </h1>
        <p className="mt-4">
          Thank you. Consent has been recorded for{" "}
          <strong>{participant?.display_name}</strong>.
        </p>
        <button
          onClick={() => router.refresh()}
          className="mt-6 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <a
        href="/dashboard"
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; Dashboard
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Consent for {participant?.display_name}
      </h1>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {/* Existing consent history */}
      {existingConsents.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">Consent history</h2>
          <div className="mt-3 space-y-2">
            {existingConsents.map((c) => (
              <div
                key={c.id}
                className={`rounded-theme border p-4 text-sm ${
                  c.withdrawn_at
                    ? "border-red-200 bg-red-50"
                    : "border-green-200 bg-green-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{c.granted_by_name}</span>
                    <span className="ml-1 opacity-60">
                      ({c.granted_by_relationship})
                    </span>
                  </div>
                  <span className="text-xs opacity-60">
                    {new Date(c.granted_at).toLocaleDateString("en-NZ")}
                  </span>
                </div>
                {c.withdrawn_at ? (
                  <p className="mt-1 text-red-700">
                    Withdrawn on{" "}
                    {new Date(c.withdrawn_at).toLocaleDateString("en-NZ")}
                  </p>
                ) : (
                  <button
                    onClick={() => handleWithdraw(c.id)}
                    disabled={saving}
                    className="mt-2 text-xs text-red-600 underline hover:opacity-80"
                  >
                    Withdraw consent
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* New consent form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label htmlFor="programme" className="block text-sm font-medium">
            Programme
          </label>
          <select
            id="programme"
            value={selectedProgramme}
            onChange={(e) => setSelectedProgramme(e.target.value)}
            className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
          >
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {consentVersions.length > 0 && consentVersions[0] && (
          <div className="rounded-theme border border-current/15 bg-white p-5">
            <h2 className="font-display text-lg font-semibold">
              {consentVersions[0].title} (v{consentVersions[0].version})
            </h2>
            <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
              {consentVersions[0].content_md}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Your full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.granted_by_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  granted_by_name: e.target.value,
                }))
              }
              placeholder="e.g. Jane Smith"
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
          </div>

          <div>
            <label htmlFor="relationship" className="block text-sm font-medium">
              Your relationship to the participant
            </label>
            <select
              id="relationship"
              value={formData.granted_by_relationship}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  granted_by_relationship: e.target.value,
                }))
              }
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            >
              <option value="">Select...</option>
              <option value="mother">Mother / female caregiver</option>
              <option value="father">Father / male caregiver</option>
              <option value="guardian">Legal guardian</option>
              <option value="self (16+)">Self (16+)</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-theme border border-current/15 p-4">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                agreeTerms: e.target.checked,
              }))
            }
            className="mt-1 h-5 w-5 rounded"
          />
          <span className="text-sm">
            I confirm that I am authorised to give consent on behalf of this
            participant. I have read and understood the programme information
            above. I understand consent can be withdrawn at any time.
            <span className="text-red-500"> *</span>
          </span>
        </label>

        <button
          type="submit"
          disabled={
            saving ||
            !formData.granted_by_name.trim() ||
            !formData.agreeTerms
          }
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {saving ? "Recording consent..." : "Give consent"}
        </button>
      </form>
    </div>
  );
}
