"""
Compass Backend - Rule-Based Compliance Assessor

This module contains the deterministic compliance engine.

Responsibilities:
- Apply prohibited term detection
- Apply weighted risk scoring
- Assign compliance tags
- Attach required disclosures
- Determine escalation requirement
- Produce structured reasoning summary

This layer intentionally avoids LLM usage.
It serves as a deterministic safety baseline.
"""

import uuid
from datetime import datetime, timezone
from .policy import load_policy_pack
from .llm import call_llm_assess, llm_enabled


def assess_text(content: str, policy_pack: str, channel: str, jurisdiction: str):
    """
    Perform deterministic compliance assessment.

    Parameters:
        content (str): Text to evaluate.
        policy_pack (str): Policy pack identifier.
        channel (str): Marketing/product/support.
        jurisdiction (str): Regulatory region.

    Returns:
        dict: Structured assessment result.
    """
    rules, disclosures_cfg, _taxonomy = load_policy_pack(policy_pack)

    text = content.lower()
    tags = set()
    score = 0
    prohibited_hits = []

    # Detect explicitly prohibited claims
    for term in rules.get("prohibited_terms", []):
        if term in text:
            prohibited_hits.append(term)

    if prohibited_hits:
        tags.add("ProhibitedClaims")
        score = max(score, 100)  # Force HIGH risk classification

    # Apply weighted risk scoring
    for item in rules.get("risky_terms", []):
        term = str(item.get("term", "")).lower()
        if term and term in text:
            score += int(item.get("weight", 0))
            tags.add(str(item.get("tag", "Uncategorized")))

    thresholds = rules.get("risk_thresholds", {"high": 70, "medium": 35})
    high_th = int(thresholds.get("high", 70))
    med_th = int(thresholds.get("medium", 35))

    # Assign risk level based on score
    if score >= high_th:
        risk_level = "HIGH"
    elif score >= med_th:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    escalation_required = risk_level == "HIGH" or "ProhibitedClaims" in tags

    # Attach required disclosures based on tags
    required_disclosures = []
    disclosure_map = disclosures_cfg.get("disclosures", {})
    for tag in sorted(tags):
        for disclosure in disclosure_map.get(tag, []):
            required_disclosures.append(disclosure)

    # Construct reasoning summary
    reasoning_parts = []
    if prohibited_hits:
        reasoning_parts.append(
            f"Detected prohibited terms: {', '.join(prohibited_hits)}."
        )
    elif score > 0:
        reasoning_parts.append(
            f"Risk score derived from policy-weighted terms, total score {score}."
        )
    else:
        reasoning_parts.append(
            "No policy-weighted risky terms detected in the content."
        )

    # Simple rewrite strategy (placeholder)
    suggested_rewrite = None

    # For prohibited claims, return a conservative rewrite template.
    # We are not trying to be legally perfect here, we are trying to be:
    # - safer than the original
    # - clean and readable for demo purposes
    if prohibited_hits:
        suggested_rewrite = (
            "Returns are not guaranteed. Investing involves risk, including the possible loss of principal. "
            "Avoid absolute language such as 'guaranteed' or 'zero risk'."
        )
        
        # Optional LLM augmentation (never authoritative)
    llm_payload = None
    llm_error = None
    used_llm = False

    if llm_enabled():
        llm_payload, llm_error = call_llm_assess(
            content=content,
            channel=channel,
            jurisdiction=jurisdiction,
            policy_pack=policy_pack,
            prohibited_terms=rules.get("prohibited_terms", []),
            risky_terms=rules.get("risky_terms", []),
        )
        used_llm = llm_payload is not None

    # Merge strategy:
    # - Rules remain authoritative for prohibited terms and escalation.
    # - We may union tags and improve rewrite and reasoning.
    final_tags = set(tags)
    final_risk_level = risk_level
    final_reasoning = " ".join(reasoning_parts)
    final_rewrite = suggested_rewrite

    if used_llm:
        # Union tags
        for t in llm_payload.get("tags", []):
            if isinstance(t, str) and t.strip():
                final_tags.add(t.strip())

        # Risk level can only increase, never decrease below rules
        llm_risk = llm_payload.get("risk_level")
        risk_rank = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
        if llm_risk in risk_rank and risk_rank[llm_risk] > risk_rank[final_risk_level]:
            final_risk_level = llm_risk

        # Prefer LLM rewrite when rules were not prohibited-only template or when LLM is cleaner
        llm_rewrite = llm_payload.get("suggested_rewrite")
        if isinstance(llm_rewrite, str) and llm_rewrite.strip():
            final_rewrite = llm_rewrite.strip()

        # Prefer LLM reasoning if present
        llm_reason = llm_payload.get("reasoning_summary")
        if isinstance(llm_reason, str) and llm_reason.strip():
            final_reasoning = llm_reason.strip()

    # Re-attach disclosures based on final tags
    required_disclosures = []
    disclosure_map = disclosures_cfg.get("disclosures", {})
    for tag in sorted(final_tags):
        for disclosure in disclosure_map.get(tag, []):
            required_disclosures.append(disclosure)

    # Escalation remains rules-driven, plus any HIGH risk
    escalation_required = escalation_required or (final_risk_level == "HIGH")

    return {
        "assessment_id": str(uuid.uuid4()),
        "policy_pack": policy_pack,
        "jurisdiction": jurisdiction,
        "input_channel": channel,
        "assessment_mode": "rules_plus_llm" if used_llm else "rules_only",
        "llm_used": used_llm,
        "llm_error": llm_error,
        "risk_level": final_risk_level,
        "tags": sorted(final_tags),
        "required_disclosures": required_disclosures,
        "suggested_rewrite": final_rewrite.strip() if final_rewrite else None,
        "ai_responsibility": [
            "Identify risky claims and categorize them",
            "Generate required disclosures",
            "Suggest compliant wording"
        ],
        "human_must_decide": {
            "decision": "Approve any HIGH risk or AMBIGUOUS assessment before release",
            "why": "Regulatory interpretation creates legal liability and requires accountable human judgment."
        },
        "escalation_required": escalation_required,
        "reasoning_summary": final_reasoning,
        "what_breaks_first_at_scale": "Regulatory drift and policy version skew without strict policy ownership and versioning.",
        "created_at": datetime.now(timezone.utc).isoformat()
    }