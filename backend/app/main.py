"""
Compass Backend - Application Entrypoint

This module initializes the FastAPI application and registers API routes.

Purpose:
- Define the application metadata
- Register route modules
- Initialize shared infrastructure at startup (audit DB)

This file should remain orchestration-focused.
Business logic belongs in service modules.
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from .api import router
from .db import init_db

from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Compass",
    version="0.1.0",
    description="AI-native Compliance Operating System prototype"
)

# Allow the Next.js dev server to call the API in the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """
    Application startup hook.

    Initializes the audit database so the system always has a place to log
    assessments. This supports traceability even in the prototype stage.
    """
    init_db()


app.include_router(router)