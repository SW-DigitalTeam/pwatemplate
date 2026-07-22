"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { programmes } from "@sw/programme-config";

export default function NewSchoolPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [town, setTown] = useState("");
  const [region, setRegion] = useState("Waikato");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([]);
  const [intendedParticipants, setIntendedParticipants] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    // Create the school
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({
        name,
        town,
        region,
        contact_name: contactName,
        contact_email: contactEmail,
        status: "pending",
      })
      .select("id")
      .single();

    if (schoolError || !school) {
      setError(schoolError?.message ?? "Could not create school.");
      setLoading(false);
      return;
    }

    // Create school_programme applications for selected programmes
    if (selectedProgrammes.length > 0) {
      const programmeConfigs = Object.values(programmes);
      for (const slug of selectedProgrammes) {
        const prog = programmeConfigs.find((p) => p.slug === slug);
        if (prog) {
          const { error: spError } = await supabase
            .from("school_programmes")
            .insert({
              school_id: school.id,
              programme_id: slug, // TODO: This should be the UUID from the programmes table; for now we use slug-based lookup
              status: "pending",
              intended_participants: intendedParticipants,
              applied_by: userId,
            });

          if (spError) {
            console.error("Could not apply for programme:", spError.message);
          }
        }
      }
    }

    // Create user role as school admin
    await supabase.from("user_roles").insert({
      user_id: userId,
      role: "school_admin",
      school_id: school.id,
    });

    setSuccess(true);
    setLoading(false);
  }

  function toggleProgramme(slug: string) {
    setSelectedProgrammes((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-primary">
          Application submitted
        </h1>
        <p className="mt-4">
          Thank you. We have received your application for{" "}
          <strong>{name}</strong>.
        </p>
        <p className="mt-2 opacity-70">
          Sport Waikato will review your application and be in touch within 5
          working days. You will receive a confirmation email at{" "}
          {contactEmail}.
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mt-8 rounded-theme bg-primary px-6 py-3 font-medium text-primary-contrast hover:opacity-90"
        >
          Return to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <p className="text-sm font-medium uppercase tracking-wide opacity-70">
        Sport Waikato
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold text-primary">
        Register your school
      </h1>
      <p className="mt-2 text-sm opacity-70">
        Fill in the details below. A Sport Waikato team member will review your
        application before you can start using the platform.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-theme border border-red-300 bg-red-50 p-4 text-red-800"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">
            School details
          </legend>

          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              School name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kōwhai College"
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="town" className="block text-sm font-medium">
                Town or suburb <span className="text-red-500">*</span>
              </label>
              <input
                id="town"
                type="text"
                required
                value={town}
                onChange={(e) => setTown(e.target.value)}
                placeholder="e.g. Hamilton"
                className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
              />
            </div>
            <div>
              <label htmlFor="region" className="block text-sm font-medium">
                Region
              </label>
              <select
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
              >
                <option value="Waikato">Waikato</option>
                <option value="Bay of Plenty">Bay of Plenty</option>
                <option value="Taranaki">Taranaki</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">
            Contact person
          </legend>

          <div>
            <label htmlFor="contactName" className="block text-sm font-medium">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="contactName"
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Your full name"
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="contactEmail"
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="your@school.nz"
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">
            Programmes you are interested in
          </legend>
          <p className="text-sm opacity-70">
            Select the programmes your school would like to participate in. You
            can add more later.
          </p>

          <div className="space-y-3">
            {Object.values(programmes).map((p) => (
              <label
                key={p.slug}
                className="flex items-start gap-3 rounded-theme border border-current/15 p-4 hover:bg-primary/5"
              >
                <input
                  type="checkbox"
                  checked={selectedProgrammes.includes(p.slug)}
                  onChange={() => toggleProgramme(p.slug)}
                  className="mt-1 h-5 w-5 rounded"
                />
                <div>
                  <span className="font-medium">{p.name}</span>
                  <p className="text-sm opacity-70">{p.description.en}</p>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label
              htmlFor="intendedParticipants"
              className="block text-sm font-medium"
            >
              Describe the intended participant group
            </label>
            <textarea
              id="intendedParticipants"
              rows={3}
              value={intendedParticipants}
              onChange={(e) => setIntendedParticipants(e.target.value)}
              placeholder="e.g. Year 9-10 students who are not engaged in traditional sport, or a specific group of students"
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
          </div>
        </fieldset>

        <p className="text-xs opacity-60">
          By submitting this form, you agree to Sport Waikato collecting and
          using this information to process your application. Your school will be
          asked to agree to full programme terms before any participants are
          enrolled.
        </p>

        <button
          type="submit"
          disabled={loading || !name || !town || !contactName || !contactEmail}
          className="w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </div>
  );
}
