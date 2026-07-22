"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type PreviewRow = Record<string, string>;

export default function ImportPage() {
  const supabase = createClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [target, setTarget] = useState<"participants" | "cohorts">("participants");
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; errors: number; errorLines: string[] } | null>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "done">("upload");

  const loadSchools = useCallback(async () => {
    const { data } = await supabase
      .from("schools")
      .select("id, name")
      .eq("status", "approved")
      .order("name");
    setSchools(data ?? []);
    if (data && data.length > 0) setSchoolId(data[0]!.id);
  }, [supabase]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        setError("File must have a header row and at least one data row.");
        return;
      }

      const h = lines[0]!.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      setHeaders(h);

      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        const row: PreviewRow = {};
        h.forEach((header, i) => {
          row[header] = values[i] ?? "";
        });
        return row;
      });

      setPreview(rows.slice(0, 10)); // Show first 10 for preview
      const autoMap: Record<string, string> = {};
      for (const col of h) {
        const lower = col.toLowerCase();
        if (lower.includes("name") || lower.includes("display")) autoMap[col] = "display_name";
        else if (lower.includes("year") || lower.includes("level")) autoMap[col] = "year_level";
        else if (lower.includes("access") || lower.includes("notes")) autoMap[col] = "accessibility_notes";
      }
      setMapping(autoMap);
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    setLoading(true);
    setError(null);

    if (!file || !schoolId) {
      setError("Select a file and school first.");
      setLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const h = lines[0]!.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1);

      let imported = 0;
      let errors = 0;
      const errorLines: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const values = rows[i]!.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        h.forEach((header, j) => {
          row[header] = values[j] ?? "";
        });

        const mapped: Record<string, string> = {};
        for (const [csvCol, dbCol] of Object.entries(mapping)) {
          if (dbCol && row[csvCol]) {
            mapped[dbCol] = row[csvCol];
          }
        }

        if (!mapped.display_name) {
          errors++;
          errorLines.push(`Row ${i + 2}: missing display name`);
          continue;
        }

        const { error: insertError } = await supabase
          .from(target)
          .insert({
            ...mapped,
            school_id: schoolId,
            access_method: "managed",
            status: "enrolled",
          });

        if (insertError) {
          errors++;
          errorLines.push(`Row ${i + 2}: ${insertError.message}`);
        } else {
          imported++;
        }
      }

      setResult({ imported, errors, errorLines });
      setStep("done");
      setLoading(false);
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-3xl py-8">
      <a href="/dashboard" className="text-sm text-primary underline hover:opacity-80">
        &larr; Dashboard
      </a>

      <h1 className="mt-4 font-display text-2xl font-bold text-primary">
        Import data
      </h1>
      <p className="text-sm opacity-70">
        Upload a CSV file to import participants in bulk.
      </p>

      {error && (
        <div role="alert" className="mt-4 rounded-theme border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === "upload" && (
        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium">School</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              onFocus={loadSchools}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            >
              <option value="">Select a school...</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Import into</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as "participants" | "cohorts")}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            >
              <option value="participants">Participants</option>
              <option value="cohorts">Cohorts (groups)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">CSV file</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1 block w-full rounded-theme border border-current/20 bg-white px-4 py-3 font-body"
            />
            <p className="mt-1 text-xs opacity-60">
              CSV must have a header row. Columns: name, year_level, etc.
            </p>
          </div>

          {preview.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold">Preview</h2>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-current/15">
                      {headers.map((h) => (
                        <th key={h} className="px-2 py-1 font-medium opacity-70">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-current/10">
                        {headers.map((h) => (
                          <td key={h} className="px-2 py-1">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-medium">Column mapping</h3>
                {headers.map((h) => (
                  <div key={h} className="flex items-center gap-3">
                    <span className="w-48 text-sm opacity-70">{h}</span>
                    <span className="text-sm opacity-40">&rarr;</span>
                    <select
                      value={mapping[h] ?? ""}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [h]: e.target.value,
                        }))
                      }
                      className="flex-1 rounded border border-current/20 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Skip</option>
                      <option value="display_name">Display name</option>
                      <option value="year_level">Year level</option>
                      <option value="accessibility_notes">Accessibility notes</option>
                    </select>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep("mapping")}
                className="mt-4 rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
              >
                Continue to import
              </button>
            </div>
          )}
        </div>
      )}

      {step === "mapping" && (
        <div className="mt-8 space-y-6">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Ready to import {preview.length > 10 ? `${rowsCount()} rows` : `${preview.length} rows shown`}
            </h2>
            <p className="text-sm opacity-70 mt-2">
              This will import all data rows from the CSV into{" "}
              <strong>{schools.find((s) => s.id === schoolId)?.name ?? "the selected school"}</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("upload")}
              className="rounded-theme border border-current/20 px-5 py-3 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !schoolId}
              className="rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Importing..." : "Start import"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="mt-8 space-y-4">
          <div className="rounded-theme border border-green-300 bg-green-50 p-6 text-center">
            <h2 className="font-display text-xl font-bold text-green-800">Import complete</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-2xl font-bold text-green-700">{result.imported}</span>
                <br />
                <span className="opacity-70">imported</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-red-700">{result.errors}</span>
                <br />
                <span className="opacity-70">errors</span>
              </div>
            </div>
          </div>

          {result.errorLines.length > 0 && (
            <div className="rounded-theme border border-red-300 bg-red-50 p-4">
              <h3 className="font-medium text-red-800">Errors</h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-700">
                {result.errorLines.slice(0, 20).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
                {result.errorLines.length > 20 && (
                  <li>...and {result.errorLines.length - 20} more errors</li>
                )}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              setStep("upload");
              setFile(null);
              setPreview([]);
              setResult(null);
            }}
            className="rounded-theme bg-primary px-5 py-3 text-sm font-medium text-primary-contrast hover:opacity-90"
          >
            Import another file
          </button>
        </div>
      )}
    </div>
  );
}

function rowsCount(): number {
  // Just returns a string; actual count is in component state
  return 0;
}
