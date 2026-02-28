"""
Compass Backend - API Routes

This module defines HTTP endpoints exposed by the Compass system.

Responsibilities:
- Define request/response contracts via Pydantic models
- Delegate business logic to the assessor (rule-based engine)
- Persist an audit trail for each assessment

The routing layer stays thin. Compliance logic lives in assessor.py.
Audit persistence lives in db.py.
"""

from fastapi import APIRouter, HTTPException
from .models import AssessRequest, AssessResponse
from .assessor import assess_text
from .db import save_assessment, list_recent_assessments, get_assessment_response

router = APIRouter()


@router.get("/health")
def health():
    """
    Health check endpoint.
    """
    return {"status": "ok"}


@router.post("/v1/assess", response_model=AssessResponse)
def assess(req: AssessRequest):
    """
    Assess input content for compliance risk, then write an audit log record.

    The audit log stores:
    - input text
    - selected policy pack and context
    - full structured response
    """
    result = assess_text(
        content=req.content,
        policy_pack=req.context.policy_pack,
        channel=req.context.channel,
        jurisdiction=req.context.jurisdiction,
    )

    save_assessment(
        assessment_id=result["assessment_id"],
        policy_pack=result["policy_pack"],
        jurisdiction=result["jurisdiction"],
        input_channel=result["input_channel"],
        input_text=req.content,
        risk_level=result["risk_level"],
        tags=result["tags"],
        response=result,
    )

    return result


@router.get("/v1/assessments")
def assessments(limit: int = 25):
    """
    List recent assessments (summary only).

    This is mainly for validating that audit logging works.
    """
    rows = list_recent_assessments(limit=limit)
    return {
        "count": len(rows),
        "items": [r.__dict__ for r in rows],
    }


@router.get("/v1/assessments/{assessment_id}")
def assessment_by_id(assessment_id: str):
    """
    Fetch a full stored assessment response by id.
    """
    payload = get_assessment_response(assessment_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return payload