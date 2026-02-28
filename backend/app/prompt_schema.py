"""
Compass Backend - LLM Structured Output Schema

This module defines the JSON schema used to constrain the LLM output.

Purpose:
- Force consistent, machine-readable output from the model.
- Reduce prompt fragility and parsing failures.
- Make failures explicit and recoverable by falling back to rules-only behavior.
"""

LLM_ASSESSMENT_SCHEMA = {
    "name": "compass_llm_assessment",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "risk_level": {
                "type": "string",
                "enum": ["LOW", "MEDIUM", "HIGH"],
                "description": "Model suggested risk level, subject to rules override."
            },
            "tags": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Suggested tag list, subject to rules override."
            },
            "suggested_rewrite": {
                "type": "string",
                "description": "Clean rewrite that avoids prohibited or absolute claims."
            },
            "reasoning_summary": {
                "type": "string",
                "description": "Short explanation of why the content is risky."
            },
            "stop_boundary": {
                "type": "string",
                "description": "Where AI must stop and require human review, expressed explicitly."
            }
        },
        "required": ["risk_level", "tags", "suggested_rewrite", "reasoning_summary", "stop_boundary"]
    },
}