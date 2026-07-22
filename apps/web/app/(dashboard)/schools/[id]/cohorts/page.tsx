"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CohortsPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params.id as string;
  const supabase = createClient();

  const [cohorts, setCohorts] = useState<
    Array<{ id: string; name: string; kind: string }>
  >([]);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState("class");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Get the school_programme IDs for this school
      const { data: sps } = await supabase
        .from("school_programmes")
        .select("id")
        .eq("school_id", schoolId);

      if (!sps || sps.length === 0) return;

      const spIds = sps.map((sp) => sp.id);
      const { data } = await supabase
        .from("cohorts")
        .select("id, name, kind, school_programme_id")
        .in("school_programme_id", spIds)
        .order("name");

      setCohorts(data ?? []);
    }
    load();
  }, [schoolId, supabase]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: sps } = await supabase
      .from("school_programmes")
      .select("id")
      .eq("school_id", schoolId)
      .limit(1);

    if (!sps || sps.length === 0 || !sps[0]) {
      setError("Your school needs to have an active programme first.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("cohorts").insert({
      school_programme_id: sps[0].id,
      name: newName,
      kind: newKind,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewName("");
      // Refresh
      const { data } = await supabase
        .from("cohorts")
        .select("id, name, kind, school_programme_id")
        .in("school_programme_id", [sps[0].id])
        .order("name");
      setCohorts(data ?? []);
    }
    setLoading(false);
  }

  return (
    <div>
      <a
        href={`/schools/${schoolId}`}
        className="text-sm text-primary underline hover:opacity-80"
      >
        &larr; School dashboard
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Manage groups
      </h1>
      <p className="text-sm opacity-70">
        Create classes, houses or groups for your programmes.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="mt-6 flex flex-wrap gap-3 rounded-theme border border-current/15 bg-white p-4"
      >
        <input
          type="text"
          required
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Group name"
          className="flex-1 rounded border border-current/20 bg-white px-4 py-3 font-body text-sm"
          aria-label="New group name"
        />
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value)}
          className="rounded border border-current/20 bg-white px-3 py-3 text-sm"
          aria-label="Group type"
        >
          <option value="class">Class</option>
          <option value="house">House</option>
          <option value="group">Group</option>
        </select>
        <button
          type="submit"
          disabled={loading || !newName.trim()}
          className="rounded bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>

      <div className="mt-6 space-y-2">
        {cohorts.length === 0 && (
          <p className="text-sm opacity-70">No groups yet. Create one above.</p>
        )}
        {cohorts.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-theme border border-current/15 bg-white p-4"
          >
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="ml-2 text-xs opacity-60">({c.kind})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
