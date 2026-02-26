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