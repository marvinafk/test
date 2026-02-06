"""
AFK Analytics Backend - FastAPI Application
============================================

Production-ready analytics service for influencer campaign analysis.

Endpoints:
    POST /api/v1/ingest     - Upload CSV, validate, return health report
    POST /api/v1/metrics    - Compute standardized KPIs
    POST /api/v1/benchmarks - Performance vs baseline analysis
    POST /api/v1/anomalies  - Anomaly detection + driver insights
    POST /api/v1/analyze    - Full pipeline analysis
    GET  /api/v1/health     - Health check

Run with:
    uvicorn analytics_backend.main:app --reload --port 8000

Or:
    python -m analytics_backend.main
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from .api.routes import router

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO"
)

# Create FastAPI app
app = FastAPI(
    title="AFK Analytics Backend",
    description="""
## Influencer Campaign Analytics API

Production-grade analytics service that competes with Streamforge and CreatorIQ.

### Features

- **Schema Normalization**: Auto-detect column mappings from arbitrary CSV formats
- **Data Validation**: Comprehensive quality checks with health scoring (0-100)
- **Standardized Metrics**: CPV, CPM, CPWH, CTR, ROI across Twitch/YouTube/TikTok
- **Benchmarking**: Compare against 30-day, 90-day baselines and cohort medians
- **Anomaly Detection**: Statistical spike/dip detection with root cause analysis
- **Driver Analysis**: Concentration analysis and performance insights

### Quick Start

1. Upload a CSV to `/api/v1/ingest` to validate data quality
2. Use `/api/v1/metrics` to calculate standardized KPIs
3. Use `/api/v1/benchmarks` to classify creator performance
4. Use `/api/v1/anomalies` for deep insights
5. Or use `/api/v1/analyze` for the full pipeline in one call
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    logger.info("AFK Analytics Backend starting up...")
    logger.info("API docs available at /docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("AFK Analytics Backend shutting down...")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "AFK Analytics Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
        "endpoints": {
            "ingest": "POST /api/v1/ingest",
            "metrics": "POST /api/v1/metrics",
            "benchmarks": "POST /api/v1/benchmarks",
            "anomalies": "POST /api/v1/anomalies",
            "analyze": "POST /api/v1/analyze",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
