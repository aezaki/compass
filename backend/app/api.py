"""
Compass Backend - API Routes

This module defines HTTP endpoints exposed by the Compass system.

Responsibilities:
- Define request/response contracts via Pydantic models
- Delegate business logic to service layer (assessor)
- Keep routing layer thin and deterministic

This layer should never contain compliance logic directly.
"""

from fastapi import APIRouter
from .models import AssessRequest, AssessResponse
from .assessor import assess_text

# Router instance for grouping endpoints
router = APIRouter()


@router.get("/health")
def health():
    """
    Health check endpoint.

    Used to verify that the API server is running.
    No business logic is executed here.
    """
    return {"status": "ok"}


@router.post("/v1/assess", response_model=AssessResponse)
def assess(req: AssessRequest):
    """
    Assess marketing or product content for compliance risk.

    Delegates assessment to the rule-based compliance engine.
    Returns structured compliance evaluation.

    Parameters:
        req (AssessRequest): User-submitted content and context.

    Returns:
        AssessResponse: Structured compliance decision.
    """
    return assess_text(
        content=req.content,
        policy_pack=req.context.policy_pack,
        channel=req.context.channel,
        jurisdiction=req.context.jurisdiction
    )