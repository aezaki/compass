/**
 * Compass Frontend - API Client
 *
 * Purpose:
 * - Provide a typed function to call the backend assessment API.
 * - Keep fetch logic out of UI components.
 */

export type Channel = "marketing" | "product" | "support";

export type AssessRequest = {
  content: string;
  context?: {
    channel: Channel;
    jurisdiction: string;
    policy_pack: string;
  };
};

export type Disclosure = {
  id: string;
  title: string;
  text: string;
};

export type AssessResponse = {
  assessment_id: string;
  policy_pack: string;
  jurisdiction: string;
  input_channel: Channel;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  tags: string[];
  required_disclosures: Disclosure[];
  suggested_rewrite: string | null;
  ai_responsibility: string[];
  human_must_decide: {
    decision: string;
    why: string;
  };
  escalation_required: boolean;
  reasoning_summary: string;
  what_breaks_first_at_scale: string;
  created_at: string;

  assessment_mode?: "rules_only" | "rules_plus_llm";
  llm_used?: boolean;
  llm_error?: string | null;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

export async function assessContent(payload: AssessRequest): Promise<AssessResponse> {
  const res = await fetch(`${BACKEND_URL}/v1/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json();
}

export type ReviewDecisionRequest = {
  decision: "approved" | "rejected";
  reviewer: string;
  notes?: string | null;
};

export type ReviewDecision = {
  assessment_id: string;
  decision: "approved" | "rejected";
  reviewer: string;
  notes?: string | null;
  decided_at: string;
};

export async function recordDecision(
  assessmentId: string,
  payload: ReviewDecisionRequest
): Promise<ReviewDecision> {
  const res = await fetch(`${BACKEND_URL}/v1/assessments/${assessmentId}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function listDecisions(
  assessmentId: string,
  limit = 10
): Promise<{ count: number; items: ReviewDecision[] }> {
  const res = await fetch(`${BACKEND_URL}/v1/assessments/${assessmentId}/decisions?limit=${limit}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json();
}

export type AssessmentSummary = {
  assessment_id: string;
  created_at: string;
  policy_pack: string;
  jurisdiction: string;
  input_channel: Channel;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  tags: string[];
  input_excerpt: string;
};

export async function listRecentAssessments(limit = 20): Promise<{ count: number; items: AssessmentSummary[] }> {
  const res = await fetch(`${BACKEND_URL}/v1/assessments?limit=${limit}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getAssessmentById(assessmentId: string): Promise<AssessResponse> {
  const res = await fetch(`${BACKEND_URL}/v1/assessments/${assessmentId}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }

  return res.json();
}