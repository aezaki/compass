/**
 * Compass Frontend - AssessmentCard
 *
 * Purpose:
 * - Present the assessment output in a readable, demo-friendly layout.
 * - Keep rendering separate from form and state logic.
 */

import { useEffect, useState } from "react";
import type { AssessResponse } from "@/lib/api";
import { listDecisions } from "@/lib/api";
import ReviewPanel from "@/components/ReviewPanel";

function riskBadgeClass(risk: AssessResponse["risk_level"]) {
  if (risk === "HIGH") return "bg-red-100 text-red-800 border-red-200";
  if (risk === "MEDIUM") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
}

type DecisionStatus = "pending" | "approved" | "rejected";

function decisionBadgeClass(status: DecisionStatus) {
  if (status === "approved") return "bg-green-100 text-green-800 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function formatDecisionLabel(status: DecisionStatus) {
  return status.toUpperCase();
}

export default function AssessmentCard({
  data,
  onClose,
}: {
  data: AssessResponse;
  onClose?: () => void;
}) {
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>("pending");
  const [decisionRefreshKey, setDecisionRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDecisionStatus() {
      try {
        const res = await listDecisions(data.assessment_id, 1);
        if (cancelled) return;

        if (res.count > 0) {
          const latest = res.items[0]?.decision;
          if (latest === "approved") setDecisionStatus("approved");
          else if (latest === "rejected") setDecisionStatus("rejected");
          else setDecisionStatus("pending");
        } else {
          setDecisionStatus("pending");
        }
      } catch {
        if (!cancelled) setDecisionStatus("pending");
      }
    }

    loadDecisionStatus();

    return () => {
      cancelled = true;
    };
  }, [data.assessment_id, decisionRefreshKey]);

  return (
    <div className="relative w-full rounded-xl border bg-white p-5 shadow-sm">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          aria-label="Close assessment"
          title="Close"
        >
          ✕
        </button>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pr-8">
        {/* Lifecycle first, classification second */}
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${decisionBadgeClass(
            decisionStatus
          )}`}
        >
          Decision: {formatDecisionLabel(decisionStatus)}
        </span>

        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${riskBadgeClass(
            data.risk_level
          )}`}
        >
          Risk: {data.risk_level}
        </span>

        {data.escalation_required ? (
          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
            Escalation required
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700">
            No escalation
          </span>
        )}

        {/* De-emphasized metadata */}
        <span className="text-[11px] text-gray-400">
          Policy: {data.policy_pack} | Jurisdiction: {data.jurisdiction} | Channel: {data.input_channel}
        </span>

        <span className="text-[11px] text-gray-400">
          Mode: {data.assessment_mode ?? "unknown"} | LLM used: {String(data.llm_used ?? false)}
        </span>
      </div>

      {data.llm_error ? (
        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          <div className="font-semibold">LLM warning</div>
          <div className="mt-1 break-words">LLM unavailable. Fallback to deterministic rules engine.</div>
        </div>
      ) : null}

      {/* AI output section */}
      <div className="mt-4">
        <div className="text-sm font-semibold text-gray-900">Reasoning</div>
        <div className="mt-1 text-sm text-gray-700">{data.reasoning_summary}</div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-gray-900">Tags</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.tags.map((t) => (
            <span key={t} className="rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-gray-900">Suggested rewrite</div>
        <div className="mt-1 rounded-lg border bg-gray-50 p-3 text-sm text-gray-800">
          {data.suggested_rewrite ?? "No rewrite provided."}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-gray-900">Required disclosures</div>
        {data.required_disclosures.length === 0 ? (
          <div className="mt-1 text-sm text-gray-600">None.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.required_disclosures.map((d) => (
              <li key={d.id} className="rounded-lg border bg-white p-3">
                <div className="text-sm font-semibold text-gray-900">{d.title}</div>
                <div className="mt-1 text-xs text-gray-500">{d.id}</div>
                <div className="mt-2 text-sm text-gray-700">{d.text}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-gray-900">What breaks first at scale</div>
        <div className="mt-1 text-sm text-gray-700">{data.what_breaks_first_at_scale}</div>
      </div>

      {/* Human responsibility section (explicit boundary) */}
      <div className="mt-6 border-t pt-6">
        <div className="text-sm font-semibold text-gray-900">Human stop boundary</div>
        <div className="mt-1 text-sm text-gray-700">{data.human_must_decide.decision}</div>
        <div className="mt-1 text-sm text-gray-600">{data.human_must_decide.why}</div>

        <ReviewPanel
          assessmentId={data.assessment_id}
          onDecisionSaved={() => setDecisionRefreshKey((x) => x + 1)}
        />
      </div>
    </div>
  );
}