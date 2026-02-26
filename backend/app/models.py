"""
Compass Backend - Data Models

This module defines all API request and response schemas.

All models are strict and typed using Pydantic to:
- Enforce contract discipline
- Ensure structured outputs
- Prevent accidental schema drift

Any change here must be intentional and documented.
"""

from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from datetime import datetime


# Supported input channels
Channel = Literal["marketing", "product", "support"]

# Allowed compliance risk levels
RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]


class AssessContext(BaseModel):
    """
    Context metadata for a compliance assessment.

    Determines which policy pack and jurisdiction
    the assessment should be evaluated against.
    """
    channel: Channel = "marketing"
    jurisdiction: str = "CA"
    policy_pack: str = "ca_baseline_v1"


class AssessRequest(BaseModel):
    """
    Incoming compliance evaluation request.

    content:
        Raw text to be evaluated for compliance risk.
    context:
        Structured metadata controlling policy selection.
    """
    content: str = Field(..., min_length=1, max_length=5000)
    context: AssessContext = AssessContext()


class Disclosure(BaseModel):
    """
    Represents a required disclosure attached to an assessment.
    """
    id: str
    title: str
    text: str


class HumanDecision(BaseModel):
    """
    Explicitly defines where AI must defer to human judgment.
    """
    decision: str
    why: str


class AssessResponse(BaseModel):
    """
    Structured output of the compliance engine.

    Designed to:
    - Be machine-readable
    - Be audit-log friendly
    - Clearly define AI responsibility boundaries
    """
    assessment_id: str
    policy_pack: str
    jurisdiction: str
    input_channel: Channel
    risk_level: RiskLevel
    tags: List[str]
    required_disclosures: List[Disclosure]
    suggested_rewrite: Optional[str] = None
    ai_responsibility: List[str]
    human_must_decide: HumanDecision
    escalation_required: bool
    reasoning_summary: str
    what_breaks_first_at_scale: str
    created_at: datetime