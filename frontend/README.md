# Compass
AI-native Compliance Operating System

Compass reimagines how regulated content is reviewed by rebuilding compliance workflows as AI-native systems rather than layering AI onto legacy processes.

Instead of relying on manual checklists and static documentation, Compass combines a deterministic rules engine with structured LLM reasoning to classify regulatory risk, generate compliant rewrites, attach required disclosures, and persist auditable human decisions.

This project was built as a demonstration of end-to-end AI-assisted workflow redesign in regulated environments.

---

## Core Idea

Traditional compliance review workflows evolved before modern AI existed. Compass redesigns the workflow from scratch:

- AI assumes cognitive responsibility for classification and drafting.
- Humans retain legal accountability for release decisions.
- Every assessment and decision is logged for auditability.
- Lifecycle state is visible at a glance.

This is not an AI wrapper. It is an AI-native operating model.

---

## Architecture Overview

### Backend
- **FastAPI** for API layer
- **SQLite** for persistence and audit logging
- Deterministic rules engine for policy evaluation
- Optional LLM augmentation via OpenAI API
- Structured JSON responses for explainability

### Frontend
- **Next.js + React**
- Tailwind CSS for clean operator-focused UI
- Lifecycle-aware sidebar with decision status indicators
- Explicit human review panel with persisted decisions

---

## Key Capabilities

- Risk classification (LOW / MEDIUM / HIGH)
- Rules-first policy pack architecture
- LLM-assisted reasoning and rewrite generation
- Required disclosure generation
- Explicit human stop boundary
- Persisted audit trail of:
  - Assessments
  - Risk tags
  - Rewrites
  - Human approval / rejection decisions
- Decision lifecycle visualization

---

## Workflow Model

1. User submits regulated content.
2. System evaluates via deterministic rules.
3. Optional LLM augments reasoning and rewrite suggestions.
4. High-risk assessments require human review.
5. Human decision is logged with reviewer + notes.
6. Lifecycle status updates in real time.

---

## What Breaks First at Scale

- Regulatory drift
- Policy version skew
- Inconsistent interpretation across jurisdictions

Compass is structured to support policy pack versioning and clear decision traceability to mitigate these risks.

---

## Tech Stack

Backend:
- Python
- FastAPI
- SQLite
- OpenAI API

Frontend:
- Next.js
- React
- Tailwind CSS

---

## Why This Matters

Responsible AI deployment in regulated environments requires:

- Clear accountability boundaries
- Deterministic fallbacks
- Explainability
- Auditability
- Human oversight

Compass demonstrates a practical implementation of those principles.