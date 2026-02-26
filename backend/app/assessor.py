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
    if prohibited_hits:
        suggested_rewrite = content
        for term in prohibited_hits:
            suggested_rewrite = (
                suggested_rewrite
                .replace(term, "")
                .replace(term.title(), "")
            )

    return {
        "assessment_id": str(uuid.uuid4()),
        "policy_pack": policy_pack,
        "jurisdiction": jurisdiction,
        "input_channel": channel,
        "risk_level": risk_level,
        "tags": sorted(tags),
        "required_disclosures": required_disclosures,
        "suggested_rewrite": suggested_rewrite.strip() if suggested_rewrite else None,
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
        "reasoning_summary": " ".join(reasoning_parts),
        "what_breaks_first_at_scale": "Regulatory drift and policy version skew without strict policy ownership and versioning.",
        "created_at": datetime.now(timezone.utc)
    }