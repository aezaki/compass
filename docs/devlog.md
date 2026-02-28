# Compass Dev Log

## Step 1: Backend scaffold and health check endpoint

Goal:
Create a minimal FastAPI backend that runs locally and confirms the server is up.

What was created:
- Directory: backend/
- Directory: backend/app/
- File: backend/app/main.py
- File: backend/app/api.py

What was implemented:
- A FastAPI application entrypoint in `backend/app/main.py`
- A router in `backend/app/api.py`
- A GET `/health` endpoint returning JSON

How to run:
- Run Uvicorn pointing at `backend.app.main:app`

Verification:
- Visiting `/health` returns:
  {"status": "ok"}
- `/` returns 404, which is expected because no root route was defined.

## Step 2: Policy packs + rule-based assessment endpoint

Goal:
Implement a deterministic compliance assessment system backed by a versioned policy pack, exposed via an API endpoint.

Directories created:
- policy_packs/
- policy_packs/ca_baseline_v1/
- docs/ (if not already created)

Files created or updated:
- policy_packs/ca_baseline_v1/rules.yml
- policy_packs/ca_baseline_v1/disclosures.yml
- policy_packs/ca_baseline_v1/taxonomy.yml
- backend/app/models.py
- backend/app/policy.py
- backend/app/assessor.py
- backend/app/api.py

Key functionality implemented:
- Policy Pack System:
  - YAML-based rules, disclosures, taxonomy stored under a versioned folder.
  - Backend loads the selected policy pack at runtime.

- Strict API Schema:
  - Pydantic request model: content + context (channel, jurisdiction, policy_pack)
  - Pydantic response model: risk level, tags, disclosures, escalation, reasoning, timestamps

- Deterministic Rule-Based Assessment:
  - Detects prohibited terms and forces HIGH risk when hit.
  - Adds weighted risk score based on policy-defined risky terms.
  - Produces tags used to attach required disclosures.
  - Produces an escalation_required boolean to force human review for HIGH risk.

Verification:
- POST /v1/assess with "Guaranteed returns with zero risk." returns:
  - risk_level: HIGH
  - tags: includes ProhibitedClaims
  - escalation_required: true
  - populated required_disclosures


## Step 3: SQLite audit logging

Goal:
Persist an auditable record of every compliance assessment, including inputs and full structured outputs.

Directories created:
- None manually (data/ is created at runtime)

Files created or updated:
- Created: backend/app/db.py
- Updated: backend/app/main.py (initialize DB on startup)
- Updated: backend/app/api.py (save assessment audit logs + add retrieval endpoints)
- Updated: backend/app/assessor.py (created_at now ISO string for JSON safety)

Key functionality implemented:
- SQLite DB created at: data/compass.db
- assessments table created automatically at app startup
- POST /v1/assess now writes an audit record containing:
  - assessment_id, created_at
  - policy_pack, jurisdiction, input_channel
  - input_text
  - risk_level
  - tags_json
  - response_json (full assessment payload)
- Added audit endpoints:
  - GET /v1/assessments?limit=N (recent summaries)
  - GET /v1/assessments/{assessment_id} (full stored payload)

Bug fix:
- Resolved JSON serialization issue by emitting created_at as ISO string and using safe JSON encoding for stored payloads.

Verification:
- data/compass.db exists after server start.
- Records are created after calling POST /v1/assess.

### Step 3.5: Rewrite output polish
- Replaced naive string deletion rewrite with a conservative, readable rewrite template for prohibited claims.
- Improves demo quality without introducing LLM dependencies.

## Step 4: LLM-augmented assessments with structured outputs

Goal:
Augment the deterministic rules engine with an optional LLM layer that improves rewrite quality and reasoning while keeping rules as the safety rail.

Directories created:
- backend/app/prompts/

Files created or updated:
- Created: backend/app/llm.py (OpenAI Responses API call + structured JSON extraction)
- Created: backend/app/prompt_schema.py (JSON schema for constrained model output)
- Created: backend/app/prompts/assess_v1.txt (prompt template)
- Updated: backend/app/assessor.py (LLM call + safe merge strategy + fallback)
- Updated: backend/app/models.py (assessment_mode, llm_used, llm_error)
- Updated: backend/app/main.py (loads .env via python-dotenv)
- Updated: backend/app/llm.py (correct Responses API structured output format, improved error surfacing)

Key functionality implemented:
- Schema-constrained model output (Structured Outputs) for stable JSON responses
- Safe fallback to rules-only when LLM fails
- Merge strategy:
  - rules remain authoritative for prohibited claims and escalation
  - risk level can only increase, never decrease below rules
  - tags are unioned and disclosures recalculated after merge
- Transparent output fields indicating whether LLM was used
- End-to-end auditability retained for rules_plus_llm outputs

Verification:
- LLM calls succeed with funded API account
- Low-risk input returns MEDIUM with interest disclosure and clean rewrite
- Audit endpoints list recent assessments and can retrieve full stored payload

