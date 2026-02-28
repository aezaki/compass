"use client";

/**
 * Compass Frontend - RecentAssessments
 *
 * Purpose:
 * - Show a readable list of recent assessments from the audit log.
 * - Allow selecting an assessment to load full details.
 */

import { useEffect, useState } from "react";
import type { AssessmentSummary } from "@/lib/api";
import { listRecentAssessments } from "@/lib/api";

function badgeClass(risk: AssessmentSummary["risk_level"]) {
  if (risk === "HIGH") return "bg-red-100 text-red-800 border-red-200";
  if (risk === "MEDIUM") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
}

export default function RecentAssessments({
  selectedId,
  onSelect,
  refreshKey,
}: {
  selectedId: string | null;
  onSelect: (assessmentId: string) => void;
  refreshKey: number;
}) {
  const [items, setItems] = useState<AssessmentSummary[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await listRecentAssessments(20);
      setItems(res.items);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load recent assessments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshKey]);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">Recent assessments</div>
        <button
          className="rounded-lg border bg-gray-50 px-2 py-1 text-xs text-gray-800 hover:bg-gray-100"
          onClick={load}
          type="button"
        >
          Refresh
        </button>
      </div>

      <div className="mt-1 text-xs text-gray-600">
        Select an assessment to load details and review decisions.
      </div>

      {err ? <div className="mt-3 text-sm text-red-700">{err}</div> : null}
      {loading ? <div className="mt-3 text-sm text-gray-600">Loading…</div> : null}

      <div className="mt-3 max-h-[520px] overflow-auto pr-1">
        <ul className="space-y-2">
          {items.map((a) => {
            const isSelected = selectedId === a.assessment_id;
            return (
              <li key={a.assessment_id}>
                <button
                  type="button"
                  onClick={() => onSelect(a.assessment_id)}
                  className={[
                    "w-full rounded-lg border p-3 text-left",
                    isSelected ? "border-black bg-gray-50" : "bg-white hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClass(a.risk_level)}`}>
                      {a.risk_level}
                    </span>
                    <span className="text-[11px] text-gray-500">{a.created_at}</span>
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    {a.policy_pack} | {a.jurisdiction} | {a.input_channel}
                  </div>

                  <div className="mt-2 text-sm text-gray-900">{a.input_excerpt || "(no preview)"}</div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded-full border bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700">
                        {t}
                      </span>
                    ))}
                    {a.tags.length > 3 ? (
                      <span className="text-[11px] text-gray-500">+{a.tags.length - 3} more</span>
                    ) : null}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}