"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StaffPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const supabase = createClient();

  const [staff, setStaff] = useState<
    Array<{
      id: string;
      role: string;
      profiles: { display_name?: string; email?: string };
    }>
  >([]);
  const [invitations, setInvitations] = useState<
    Array<{
      id: string;
      email: string;
      role: string;
      expires_at: string;
      accepted_at: string | null;
    }>
  >([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id, role, profiles(display_name, email)")
        .eq("school_id", schoolId)
        .is("revoked_at", null);

      setStaff(
        (existing ?? []).map((s) => ({
          id: s.id,
          role: s.role,
          profiles: s.profiles as unknown as {
            display_name?: string;
            email?: string;
          },
        }))
      );

      const { data: invs } = await supabase
        .from("invitations")
        .select("id, email, role, expires_at, accepted_at")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      setInvitations(invs ?? []);
      setLoading(false);
    }
    load();
  }, [schoolId, supabase]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: inviteError } = await supabase.from("invitations").insert({
      email,
      role,
      school_id: schoolId,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (inviteError) {
      setError(inviteError.message);
    } else {
      setSuccess(true);
      setEmail("");
      // Refresh invitations
      const { data: invs } = await supabase
        .from("invitations")
        .select("id, email, role, expires_at, accepted_at")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });
      setInvitations(invs ?? []);
    }
    setSaving(false);
  }

  async function handleRevoke(roleId: string) {
    await supabase
      .from("user_roles")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", roleId);

    setStaff((prev) => prev.filter((s) => s.id !== roleId));
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
        href={`/schools/${schoolId}`}
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; School dashboard
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Manage staff
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
          Invitation sent. The teacher will receive an email with instructions.
        </div>
      )}

      {/* Current staff */}
      {staff.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">Current staff</h2>
          <div className="mt-3 space-y-2">
            {staff.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-theme border border-current/15 bg-white p-4"
              >
                <div>
                  <span className="font-medium">
                    {s.profiles.display_name ?? s.profiles.email ?? "Unknown"}
                  </span>
                  <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {s.role.replace(/_/g, " ")}
                  </span>
                </div>
                <button
                  onClick={() => handleRevoke(s.id)}
                  className="text-sm text-red-600 underline hover:opacity-80"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite new staff */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Invite staff</h2>
        <form
          onSubmit={handleInvite}
          className="mt-4 flex flex-wrap gap-3 rounded-theme border border-current/15 bg-white p-4"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@school.nz"
            className="flex-1 rounded border border-current/20 bg-white px-4 py-3 font-body text-sm"
            aria-label="Email address"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded border border-current/20 bg-white px-3 py-3 text-sm"
            aria-label="Role"
          >
            <option value="teacher">Teacher</option>
            <option value="facilitator">Facilitator</option>
            <option value="school_admin">School admin</option>
          </select>
          <button
            type="submit"
            disabled={saving || !email}
            className="rounded bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Sending..." : "Send invite"}
          </button>
        </form>
      </section>

      {/* Pending invitations */}
      {invitations.filter((i) => !i.accepted_at).length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">
            Pending invitations
          </h2>
          <div className="mt-3 space-y-2">
            {invitations
              .filter((i) => !i.accepted_at)
              .map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between rounded-theme border border-current/15 bg-white p-4 text-sm"
                >
                  <div>
                    <span className="font-medium">{i.email}</span>
                    <span className="ml-2 opacity-60">
                      {i.role.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-xs opacity-60">
                    Expires{" "}
                    {new Date(i.expires_at).toLocaleDateString("en-NZ")}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Accepted invitations */}
      {invitations.filter((i) => i.accepted_at).length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">Accepted</h2>
          <div className="mt-3 space-y-2">
            {invitations
              .filter((i) => i.accepted_at)
              .map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between rounded-theme border border-green-200 bg-green-50 p-4 text-sm"
                >
                  <span className="font-medium">{i.email}</span>
                  <span className="text-xs text-green-700">Accepted</span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
