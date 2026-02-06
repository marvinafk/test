"""
AFK Analytics Backend
=====================

Production-grade analytics service for influencer campaign analysis.

Modules:
    - core.normalizer: Schema normalization + data validation
    - core.benchmarking: Baseline benchmarking engine
    - core.anomaly: Anomaly detection + driver analysis
    - api.routes: FastAPI endpoints
    - models.schemas: Pydantic data models

Usage:
    # Start the server
    uvicorn analytics_backend.main:app --reload --port 8000

    # Or run directly
    python -m analytics_backend.main
"""

__version__ = "1.0.0"
__author__ = "AFK"
