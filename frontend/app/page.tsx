/**
 * Compass Frontend - Demo Page
 *
 * Purpose:
 * - Provide a minimal UI to submit content for assessment.
 * - Render the assessment result in a clean, demo-friendly layout.
 */

"use client";

import { useMemo, useState } from "react";
import AssessmentCard from "@/components/AssessmentCard";
import RecentAssessments from "@/components/RecentAssessments";
import { assessContent, getAssessmentById, type AssessResponse, type Channel } from "@/lib/api";


const EXAMPLES = [
  {
    label: "High risk example",
    content: "Guaranteed returns with zero risk.",
  },
  {
    label: "Interest claim example",
    content: "Earn interest on your cash. Rates may change.",
  },
];

export default function Page() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("marketing");
  const [jurisdiction, setJurisdiction] = useState("CA");
  const [policyPack, setPolicyPack] = useState("ca_baseline_v1");

  const [content, setContent] = useState(EXAMPLES[0].content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessResponse | null>(null);

  const canSubmit = useMemo(() => content.trim().length > 0 && !loading, [content, loading]);

  async function onSubmit() {

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const data = await assessContent({
        content,
        context: {
          channel,
          jurisdiction,
          policy_pack: policyPack,
        },
      });
      setResult(data);
      setSelectedId(data.assessment_id);
      setRefreshKey((x) => x + 1);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }

  }

  async function onSelectAssessment(id: string) {
    setError(null);
    setLoading(true);
    try {
      const full = await getAssessmentById(id);
      setResult(full);
      setSelectedId(id);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-bold text-gray-900">Compass</h1>
      <p className="mt-1 text-sm text-gray-600">
        AI-native Compliance Operating System, rules-first with optional LLM augmentation and audit logging.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[360px_1fr]">
        <aside>
          <RecentAssessments
            selectedId={selectedId}
            onSelect={onSelectAssessment}
            refreshKey={refreshKey}
          />
        </aside>

        <section className="min-w-0">
          <div className="grid gap-4 rounded-xl border bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-gray-900">Channel</span>
                <select
                  className="rounded-lg border p-2"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                >
                  <option value="marketing">marketing</option>
                  <option value="product">product</option>
                  <option value="support">support</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-semibold text-gray-900">Jurisdiction</span>
                <input
                  className="rounded-lg border p-2"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-semibold text-gray-900">Policy pack</span>
                <input
                  className="rounded-lg border p-2"
                  value={policyPack}
                  onChange={(e) => setPolicyPack(e.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">Content</span>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.label}
                      className="rounded-lg border bg-gray-50 px-3 py-1 text-xs text-gray-800 hover:bg-gray-100"
                      onClick={() => setContent(ex.content)}
                      type="button"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="min-h-[140px] w-full rounded-lg border p-3 text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste marketing or product copy here…"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={onSubmit}
                disabled={!canSubmit}
              >
                {loading ? "Assessing…" : "Assess"}
              </button>

              {error ? <span className="text-sm text-red-700">{error}</span> : null}
            </div>
          </div>

          {result ? (
            <div className="mt-6">
              <AssessmentCard
                data={result}
                onClose={() => {
                  setResult(null);
                  setSelectedId(null);
                  setContent("");
                }}
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}