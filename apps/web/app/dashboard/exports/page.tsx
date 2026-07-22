"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ExportsPage() {
  const supabase = createClient();
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [surveys, setSurveys] = useState<Array<Record<string, any>>>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState("");

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase
        .from("schools")
        .select("id, name")
        .eq("status", "approved")
        .order("name");
      setSchools(s ?? []);

      const { data: sv } = await supabase
        .from("surveys")
        .select("id, key, title, programmes(name)")
        .order("key");
      setSurveys((sv as any[]) ?? []);
    }
    load();
  }, [supabase]);

  function downloadCsv(url: string) {
    window.open(url, "_blank");
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <a href="/dashboard" className="text-sm text-primary underline hover:opacity-80">
        &larr; Dashboard
      </a>

      <h1 className="mt-4 font-display text-3xl font-bold">Data exports</h1>
      <p className="mt-2 text-sm opacity-70">
        Download programme data as CSV files. Reports with fewer than 5 participants have
        identifying fields suppressed.
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div className="rounded-theme border border-current/15 bg-white p-6">
          <h2 className="font-display text-lg font-semibold">Participants</h2>
          <p className="mt-1 text-sm opacity-70">
            Export participant list with pseudonym, status, and enrolment info.
          </p>
          <div className="mt-4">
            <label htmlFor="school-export" className="block text-sm font-medium">
              School (optional)
            </label>
            <select
              id="school-export"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
            >
              <option value="">All schools</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() =>
              downloadCsv(`/api/export/participants${selectedSchool ? `?school_id=${selectedSchool}` : ""}`)
            }
            className="mt-4 w-full rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
          >
            Download participants CSV
          </button>
        </div>

        <div className="rounded-theme border border-current/15 bg-white p-6">
          <h2 className="font-display text-lg font-semibold">Survey responses</h2>
          <p className="mt-1 text-sm opacity-70">
            Export submitted survey responses with optional pseudonym matching.
          </p>
          <div className="mt-4">
            <label htmlFor="survey-export" className="block text-sm font-medium">Survey</label>
            <select
              id="survey-export"
              value={selectedSurvey}
              onChange={(e) => setSelectedSurvey(e.target.value)}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body text-sm"
            >
              <option value="">Select a survey...</option>
              {surveys.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.programmes?.[0]?.name ?? s.key} — {s.key}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() =>
              downloadCsv(`/api/export/surveys${selectedSurvey ? `?survey_id=${selectedSurvey}` : ""}`)
            }
            disabled={!selectedSurvey}
            className="mt-4 w-full rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90 disabled:opacity-50"
          >
            Download responses CSV
          </button>
        </div>

        <div className="rounded-theme border border-current/15 bg-white p-6">
          <h2 className="font-display text-lg font-semibold">Participation summary</h2>
          <p className="mt-1 text-sm opacity-70">Aggregated participation data by programme and school.</p>
          <button
            onClick={() =>
              supabase.from("v_participation_summary").select("*").then(({ data }) => {
                if (!data || data.length === 0) return;
                const headers = Object.keys(data[0]!).join(",");
                const rows = data.map((row) => Object.values(row).join(",")).join("\n");
                const csv = headers + "\n" + rows;
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `participation-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              })
            }
            className="mt-4 w-full rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
          >
            Download summary CSV
          </button>
        </div>

        <div className="rounded-theme border border-current/15 bg-white p-6">
          <h2 className="font-display text-lg font-semibold">Movement data</h2>
          <p className="mt-1 text-sm opacity-70">Aggregated movement entries by programme, measure, and week.</p>
          <button
            onClick={() =>
              supabase.from("v_movement_rollup").select("*").limit(1000).then(({ data }) => {
                if (!data || data.length === 0) return;
                const headers = Object.keys(data[0]!).join(",");
                const rows = data.map((row) => Object.values(row).join(",")).join("\n");
                const csv = headers + "\n" + rows;
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `movement-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              })
            }
            className="mt-4 w-full rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
          >
            Download movement CSV
          </button>
        </div>
      </div>
    </div>
  );
}
