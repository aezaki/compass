"""
Compass Backend - Application Entrypoint

This module initializes the FastAPI application and registers API routes.

Purpose:
- Define the application metadata
- Register route modules
- Later: initialize shared infrastructure such as database connections

This file should remain thin and orchestration-focused.
Business logic belongs in service modules.
"""

from fastapi import FastAPI
from .api import router

# Instantiate FastAPI application with metadata
app = FastAPI(
    title="Compass",
    version="0.1.0",
    description="AI-native Compliance Operating System prototype"
)

# Register API routes
app.include_router(router)