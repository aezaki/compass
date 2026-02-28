"""
Compass Backend - LLM Client

This module optionally calls an LLM to produce a structured compliance assessment.

Design goals:
- Optional: system must work without an API key.
- Strict: LLM output must adhere to a JSON schema (Structured Outputs).
- Safe: rules engine remains the final authority.
- Resilient: failures fall back to rules-only behavior.

We use the OpenAI Responses API with Structured Outputs, which allows schema-constrained JSON.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import httpx

from .prompt_schema import LLM_ASSESSMENT_SCHEMA


def _load_prompt(name: str) -> str:
    """
    Load a prompt template from backend/app/prompts/.

    Parameters:
        name: File name such as "assess_v1.txt"

    Returns:
        str: Prompt text.
    """
    prompts_dir = Path(__file__).resolve().parent / "prompts"
    return (prompts_dir / name).read_text(encoding="utf-8")


def llm_enabled() -> bool:
    """
    Returns True if an API key is present.
    """
    return bool(os.getenv("OPENAI_API_KEY", "").strip())


def call_llm_assess(
    *,
    content: str,
    channel: str,
    jurisdiction: str,
    policy_pack: str,
    prohibited_terms: list[str],
    risky_terms: list[dict[str, Any]],
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Call the model to produce a structured assessment.

    Returns:
        (payload, error)
        payload: dict if successful, else None
        error: error message if failed, else None
    """
    if not llm_enabled():
        return None, "LLM disabled (missing OPENAI_API_KEY)"

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-5").strip()
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    timeout_s = int(os.getenv("LLM_TIMEOUT_SECONDS", "20"))

    prompt = _load_prompt("assess_v1.txt")

    # Provide minimal, grounded context to the model.
    # We do not dump entire policy YAML, we provide lists that matter for detection and tags.
    input_text = (
        f"{prompt}\n\n"
        f"policy_pack: {policy_pack}\n"
        f"jurisdiction: {jurisdiction}\n"
        f"channel: {channel}\n\n"
        f"known_prohibited_terms: {prohibited_terms}\n"
        f"known_risky_terms: {risky_terms}\n\n"
        f"content:\n{content}\n"
    )

    # Responses API call with schema constrained JSON output.
    # Structured outputs: response_format = {"type":"json_schema","json_schema":{...}}
    # See OpenAI Structured Outputs docs.
    body = {
        "model": model,
        "input": [
            {"role": "system", "content": "Return only valid JSON matching the provided schema."},
            {"role": "user", "content": input_text},
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": LLM_ASSESSMENT_SCHEMA["name"],
                "schema": LLM_ASSESSMENT_SCHEMA["schema"],
                "strict": True,
            }
        },
    }

    url = f"{base_url}/responses"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=timeout_s) as client:
            resp = client.post(url, headers=headers, json=body)
            if resp.status_code >= 400:
                return None, f"LLM request failed: {resp.status_code} {resp.text}"
            data = resp.json()
    except Exception as e:
        return None, f"LLM request failed: {e}"

    # Extract the JSON output.
    # Responses API returns output items, we attempt a few common paths.
    payload = _extract_structured_json(data)
    if payload is None:
        return None, "LLM response did not contain parseable JSON output"

    return payload, None


def _extract_structured_json(response: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extract the schema constrained JSON output from a Responses API response.

    The Responses API returns a list of output items. We search for text content
    and parse it as JSON.

    Returns:
        dict if found, else None
    """
    # Common shape: response["output"] is a list of items
    output_items = response.get("output", [])
    for item in output_items:
        content_list = item.get("content", [])
        for c in content_list:
            # Common content shape: {"type":"output_text","text":"{...json...}"}
            if isinstance(c, dict) and "text" in c:
                text = c.get("text")
                if isinstance(text, str):
                    try:
                        return json.loads(text)
                    except Exception:
                        continue

    # Fallback: sometimes APIs include a top-level "output_text"
    if isinstance(response.get("output_text"), str):
        try:
            return json.loads(response["output_text"])
        except Exception:
            return None

    return None