"use client";

/**
 * Compass Frontend - ReviewPanel
 *
 * Purpose:
 * - Provide a minimal reviewer workflow: approve/reject + notes
 * - Display decision history for an assessment
 */

import { useEffect, useState } from "react";
import { listDecisions, recordDecision, type ReviewDecision } from "@/lib/api";

export default function ReviewPanel({ assessmentId }: { assessmentId: string }) {
  const [reviewer, setReviewer] = useState("andrew.zaki");
  const [decision, setDecision] = useState<"approved" | "rejected">("rejected");
  const [notes, setNotes] = useState("Contains absolute guarantees. Reject and request rewrite + disclosures.");

  const [history, setHistory] = useState<ReviewDecision[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const res = await listDecisions(assessmentId, 10);
    setHistory(res.items);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, [assessmentId]);

  async function onSubmit() {
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      await recordDecision(assessmentId, {
        decision,
        reviewer: reviewer.trim(),
        notes: notes.trim() ? notes.trim() : null,
      });
      setMsg("Decision saved.");
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save decision");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl border bg-white p-5">
      <div className="text-sm font-semibold text-gray-900">Human review</div>
      <div className="mt-1 text-xs text-gray-600">
        This is the accountability boundary, AI recommends, a human approves or rejects release.
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-gray-800">Reviewer</span>
          <input
            className="rounded-lg border p-2 text-sm"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
            placeholder="reviewer id"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-semibold text-gray-800">Decision</span>
          <select
            className="rounded-lg border p-2 text-sm"
            value={decision}
            onChange={(e) => setDecision(e.target.value as any)}
          >
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={onSubmit}
            disabled={loading || !reviewer.trim()}
          >
            {loading ? "Saving…" : "Save decision"}
          </button>
        </div>
      </div>

      <label className="mt-3 grid gap-1">
        <span className="text-xs font-semibold text-gray-800">Notes</span>
        <textarea
          className="min-h-[80px] rounded-lg border p-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional justification, next steps, or escalation notes…"
        />
      </label>

      {msg ? <div className="mt-3 text-sm text-green-700">{msg}</div> : null}
      {err ? <div className="mt-3 text-sm text-red-700">{err}</div> : null}

      <div className="mt-5">
        <div className="text-xs font-semibold text-gray-800">Decision history</div>
        {history.length === 0 ? (
          <div className="mt-2 text-sm text-gray-600">No decisions recorded yet.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {history.map((h, idx) => (
              <li key={`${h.decided_at}-${idx}`} className="rounded-lg border bg-gray-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">{h.decision}</span>
                  <span className="text-xs text-gray-500">{h.decided_at}</span>
                </div>
                <div className="mt-1 text-xs text-gray-600">Reviewer: {h.reviewer}</div>
                {h.notes ? <div className="mt-2 text-sm text-gray-700">{h.notes}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}