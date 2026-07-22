"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOfflineStatus } from "@/lib/offline/useOffline";
import { enqueue } from "@/lib/offline/outbox";

type Participant = {
  id: string;
  display_name: string;
  status: string;
};

export default function SessionAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const supabase = createClient();
  const { online, queueSize, syncNow } = useOfflineStatus();

  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendance, setAttendance] = useState<
    Record<string, "present" | "absent" | "late" | "left_early">
  >({});
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: sess } = await supabase
        .from("sessions")
        .select("*, school_programmes(school_id, cohort_id, programmes(name))")
        .eq("id", sessionId)
        .single();

      if (!sess) {
        setError("Session not found.");
        setLoading(false);
        return;
      }

      setSession(sess);

      const sp = sess.school_programmes as unknown as {
        school_id: string;
        cohort_id: string | null;
      };

      const { data: existing } = await supabase
        .from("attendance")
        .select("participant_id, status")
        .eq("session_id", sessionId)
        .is("superseded_by", null);

      if (existing) {
        const map: Record<
          string,
          "present" | "absent" | "late" | "left_early"
        > = {};
        for (const a of existing) {
          map[a.participant_id] = a.status as
            | "present"
            | "absent"
            | "late"
            | "left_early";
        }
        setAttendance(map);
      }

      const { data: parts } = await supabase
        .from("participants")
        .select("id, display_name, status")
        .eq("school_id", sp.school_id)
        .eq("status", "active")
        .order("display_name");

      setParticipants(parts ?? []);
      setLoading(false);
    }
    load();
  }, [sessionId, supabase]);

  function toggleAttendance(
    participantId: string,
    status: "present" | "absent" | "late" | "left_early"
  ) {
    setAttendance((prev) => ({
      ...prev,
      [participantId]: status,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const records = Object.entries(attendance).map(
      ([participantId, status]) => ({
        session_id: sessionId,
        participant_id: participantId,
        status,
        recorded_by: userId,
      })
    );

    if (records.length === 0) {
      setError("No attendance records to save.");
      setSaving(false);
      return;
    }

    // OFFLINE MODE: queue in IndexedDB instead of direct API call
    if (!online) {
      try {
        for (const record of records) {
          await enqueue("attendance", "INSERT", record as Record<string, unknown>);
        }
        setOfflineQueued(true);
        setSuccess(true);
      } catch (err) {
        setError("Could not save offline. Please try again.");
      }
      setSaving(false);
      return;
    }

    // ONLINE MODE: direct API call
    const { error: insErr } = await supabase.from("attendance").upsert(records, {
      onConflict: "session_id, participant_id, superseded_by",
      ignoreDuplicates: false,
    });

    if (insErr) {
      setError(insErr.message);
    } else {
      await supabase
        .from("sessions")
        .update({
          status: "completed",
          delivery_notes: notes || null,
        })
        .eq("id", sessionId);

      setSuccess(true);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="opacity-70">Loading session...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-primary">
          {offlineQueued ? "Attendance queued" : "Attendance saved"}
        </h1>
        <p className="mt-4">
          {offlineQueued
            ? "Attendance has been saved to this device and will sync when you're back online."
            : "Attendance has been recorded."}
        </p>
        {offlineQueued && (
          <div className="mt-4 rounded bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Sync status</p>
            <p className="mt-1">
              {queueSize} item{queueSize !== 1 ? "s" : ""} waiting to sync.
              {online ? " Syncing now." : " Will sync when connection returns."}
            </p>
            {online && (
              <button
                onClick={async () => {
                  await syncNow();
                  router.push("/sessions");
                }}
                className="mt-2 rounded bg-amber-200 px-4 py-2 text-sm font-medium hover:bg-amber-300"
              >
                Force sync
              </button>
            )}
          </div>
        )}
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
            Take attendance
          </h1>
          <p className="text-sm opacity-70">
            {(session as Record<string, unknown>)?.title as string ?? "Session"}{" "}
            &middot;{" "}
            {new Date(
              (session as Record<string, unknown>)?.scheduled_at as string
            ).toLocaleDateString("en-NZ", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        {/* Offline indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              online ? "bg-green-500" : "bg-amber-500"
            }`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium opacity-70">
            {online ? "Online" : "Offline"}
          </span>
          {queueSize > 0 && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              {queueSize} queued
            </span>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="mt-6 space-y-1">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-theme border border-current/15 bg-white p-4"
          >
            <span className="font-medium">{p.display_name}</span>
            <div className="flex gap-1">
              {(["present", "late", "left_early", "absent"] as const).map(
                (s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleAttendance(p.id, s)}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                      attendance[p.id] === s
                        ? s === "absent"
                          ? "bg-red-100 text-red-800 ring-2 ring-red-300"
                          : s === "late"
                            ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300"
                            : "bg-green-100 text-green-800 ring-2 ring-green-300"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {s === "present"
                      ? "Present"
                      : s === "late"
                        ? "Late"
                        : s === "left_early"
                          ? "Left early"
                          : "Absent"}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {participants.length === 0 && (
        <p className="mt-8 text-center opacity-70">
          No active participants at this school. Enrol participants first.
        </p>
      )}

      <div className="mt-6">
        <label htmlFor="notes" className="block text-sm font-medium">
          Delivery notes (optional)
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about how the session went..."
          className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
        />
      </div>

      {participants.length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 w-full rounded-theme bg-primary px-5 py-4 font-medium text-primary-contrast hover:opacity-90 focus-visible:ring-2 disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : online
              ? `Save attendance (${Object.keys(attendance).length} recorded)`
              : `Save offline (${Object.keys(attendance).length} recorded)`}
        </button>
      )}
    </div>
  );
}
