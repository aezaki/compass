/**
 * Compass Frontend - AssessmentCard
 *
 * Purpose:
 * - Present the assessment output in a readable, demo-friendly layout.
 * - Keep rendering separate from form and state logic.
 */

import type { AssessResponse } from "@/lib/api";
import ReviewPanel from "@/components/ReviewPanel";

function riskBadgeClass(risk: AssessResponse["risk_level"]) {
  if (risk === "HIGH") return "bg-red-100 text-red-800 border-red-200";
  if (risk === "MEDIUM") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
}

export default function AssessmentCard({ data }: { data: AssessResponse }) {
  return (
    <div className="w-full rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${riskBadgeClass(data.risk_level)}`}>
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

        <span className="text-xs text-gray-500">
          Policy: {data.policy_pack} | Jurisdiction: {data.jurisdiction} | Channel: {data.input_channel}
        </span>

        <span className="text-xs text-gray-500">
          Mode: {data.assessment_mode ?? "unknown"} | LLM used: {String(data.llm_used ?? false)}
        </span>
      </div>

      {data.llm_error ? (
        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          <div className="font-semibold">LLM warning</div>
          <div className="mt-1 break-words">LLM unavailable. Fallback to deterministic rules engine.</div>
        </div>
      ) : null}

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
        <div className="text-sm font-semibold text-gray-900">Human stop boundary</div>
        <div className="mt-1 text-sm text-gray-700">{data.human_must_decide.decision}</div>
        <div className="mt-1 text-sm text-gray-600">{data.human_must_decide.why}</div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold text-gray-900">What breaks first at scale</div>
        <div className="mt-1 text-sm text-gray-700">{data.what_breaks_first_at_scale}</div>
      </div>

      <ReviewPanel assessmentId={data.assessment_id} />
    </div>
  );
}