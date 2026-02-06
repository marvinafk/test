"""
FastAPI Routes for AFK Analytics Backend
=========================================

Endpoints:
- POST /ingest    - Upload CSV, normalize, validate, return health report
- POST /metrics   - Compute standardized KPIs from ingested data
- POST /benchmarks - Return performance vs baseline classifications
- POST /anomalies - Return anomaly detection + driver insights
- POST /analyze   - Full pipeline: ingest -> metrics -> benchmark -> anomalies
"""

import io
from datetime import datetime
from typing import Optional

import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from loguru import logger

from ..core.normalizer import SchemaNormalizer
from ..core.benchmarking import BenchmarkingEngine
from ..core.anomaly import AnomalyDetector
from ..models.schemas import (
    Platform,
    IngestResponse,
    MetricsResponse,
    BenchmarkResponse,
    AnomalyResponse,
    CreatorMetrics,
)


router = APIRouter(prefix="/api/v1", tags=["analytics"])

# Initialize engines
normalizer = SchemaNormalizer()
benchmarker = BenchmarkingEngine()
anomaly_detector = AnomalyDetector()

# In-memory cache for session data (in production, use Redis)
session_cache = {}


@router.post("/ingest", response_model=IngestResponse)
async def ingest_csv(
    file: UploadFile = File(...),
    platform_hint: Optional[str] = Form(None),
    campaign_name: Optional[str] = Form(None),
):
    """
    Upload and process campaign CSV file.

    Performs:
    1. Auto-detection of column mappings
    2. Platform detection (Twitch/YouTube/TikTok)
    3. Data validation and cleaning
    4. Health score calculation

    Returns:
    - Health report with score 0-100
    - List of detected issues
    - Cleaned data preview
    """
    try:
        # Read uploaded file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        logger.info(f"Received CSV: {file.filename}, {len(df)} rows")

        # Parse platform hint
        platform = None
        if platform_hint:
            try:
                platform = Platform(platform_hint.lower())
            except ValueError:
                pass

        # Process through normalizer
        df_clean, health_report = normalizer.process(df, platform_hint=platform)

        # Generate session ID and cache cleaned data
        session_id = f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{hash(file.filename) % 10000}"
        session_cache[session_id] = {
            "df": df_clean,
            "platform": health_report.detected_platform,
            "campaign_name": campaign_name or file.filename,
            "created_at": datetime.utcnow(),
        }

        # Add session_id to response for chaining requests
        response_data = IngestResponse(
            success=health_report.health_score >= 50,
            message=f"Processed {len(df_clean)} rows. Session ID: {session_id}",
            health_report=health_report,
            cleaned_data=df_clean.head(10).to_dict(orient="records"),
            row_count=len(df_clean),
        )

        return response_data

    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    except Exception as e:
        logger.error(f"Ingest error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/metrics", response_model=MetricsResponse)
async def compute_metrics(
    file: UploadFile = File(...),
    platform_hint: Optional[str] = Form(None),
):
    """
    Compute standardized KPIs from campaign CSV.

    Calculates per-creator:
    - EMV (Estimated Media Value)
    - ROI
    - CPV (Cost Per View)
    - CPM (Cost Per Mille)
    - CPWH (Cost Per Watch Hour - Twitch)
    - CTR, Conversion Rate, Engagement Rate

    Returns campaign totals and per-creator metrics.
    """
    try:
        # Read and normalize
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        platform = None
        if platform_hint:
            try:
                platform = Platform(platform_hint.lower())
            except ValueError:
                pass

        df_clean, health_report = normalizer.process(df, platform_hint=platform)
        detected_platform = health_report.detected_platform

        # Calculate metrics
        metrics = benchmarker.calculate_metrics(df_clean, detected_platform)

        # Calculate campaign totals
        totals = {
            "total_creators": len(metrics),
            "total_spend": round(sum(m.creator_rate for m in metrics), 2),
            "total_emv": round(sum(m.emv for m in metrics), 2),
            "total_views": round(sum(m.views for m in metrics), 0),
            "overall_roi": round(
                sum(m.emv for m in metrics) / sum(m.creator_rate for m in metrics)
                if sum(m.creator_rate for m in metrics) > 0 else 0,
                2
            ),
            "platform": detected_platform.value,
        }

        return MetricsResponse(
            success=True,
            campaign_totals=totals,
            creator_metrics=metrics,
            generated_at=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"Metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Metrics calculation error: {str(e)}")


@router.post("/benchmarks", response_model=BenchmarkResponse)
async def run_benchmarks(
    file: UploadFile = File(...),
    platform_hint: Optional[str] = Form(None),
):
    """
    Run performance benchmarking against baselines.

    Compares each creator against:
    - Their 30-day baseline (if provided in CSV)
    - Their 90-day baseline (if provided in CSV)
    - Cohort median (same platform + genre)

    Returns:
    - Per-creator performance classification (Overperforming/Expected/Underperforming)
    - Structured JSON insights
    - Plain-English summary
    """
    try:
        # Read and normalize
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        platform = None
        if platform_hint:
            try:
                platform = Platform(platform_hint.lower())
            except ValueError:
                pass

        df_clean, health_report = normalizer.process(df, platform_hint=platform)
        detected_platform = health_report.detected_platform

        # Run benchmark analysis
        benchmark_result = benchmarker.run_benchmark(df_clean, detected_platform)

        return BenchmarkResponse(
            success=True,
            benchmark_result=benchmark_result,
            generated_at=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"Benchmark error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Benchmark error: {str(e)}")


@router.post("/anomalies", response_model=AnomalyResponse)
async def detect_anomalies(
    file: UploadFile = File(...),
    platform_hint: Optional[str] = Form(None),
):
    """
    Run anomaly detection and driver analysis.

    Detects:
    - Spikes/dips in views, CCV, CTR, conversions
    - Outliers using Z-score and IQR methods
    - Performance concentration (Top X% = Y% of results)

    Returns:
    - Anomalies list with severity scores
    - Likely cause hypotheses
    - Driver analysis (best genre, country, etc.)
    - Client-ready insight summary paragraph
    """
    try:
        # Read and normalize
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        platform = None
        if platform_hint:
            try:
                platform = Platform(platform_hint.lower())
            except ValueError:
                pass

        df_clean, health_report = normalizer.process(df, platform_hint=platform)
        detected_platform = health_report.detected_platform

        # Calculate metrics first
        metrics = benchmarker.calculate_metrics(df_clean, detected_platform)

        # Run anomaly detection
        driver_analysis = anomaly_detector.run_analysis(
            df_clean, metrics, detected_platform
        )

        return AnomalyResponse(
            success=True,
            driver_analysis=driver_analysis,
            generated_at=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"Anomaly detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Anomaly detection error: {str(e)}")


@router.post("/analyze")
async def full_analysis(
    file: UploadFile = File(...),
    platform_hint: Optional[str] = Form(None),
    campaign_name: Optional[str] = Form(None),
):
    """
    Run complete analysis pipeline.

    Combines all endpoints:
    1. Ingest and validate CSV
    2. Calculate standardized metrics
    3. Run benchmarking analysis
    4. Detect anomalies and drivers

    Returns comprehensive analysis in a single response.
    """
    try:
        # Read file once
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        logger.info(f"Full analysis: {file.filename}, {len(df)} rows")

        # Parse platform hint
        platform = None
        if platform_hint:
            try:
                platform = Platform(platform_hint.lower())
            except ValueError:
                pass

        # Step 1: Normalize and validate
        df_clean, health_report = normalizer.process(df, platform_hint=platform)
        detected_platform = health_report.detected_platform

        # Step 2: Calculate metrics
        metrics = benchmarker.calculate_metrics(df_clean, detected_platform)

        # Step 3: Run benchmarking
        benchmark_result = benchmarker.run_benchmark(df_clean, detected_platform)

        # Step 4: Run anomaly detection
        driver_analysis = anomaly_detector.run_analysis(
            df_clean, metrics, detected_platform
        )

        # Calculate campaign totals
        totals = {
            "total_creators": len(metrics),
            "total_spend": round(sum(m.creator_rate for m in metrics), 2),
            "total_emv": round(sum(m.emv for m in metrics), 2),
            "total_views": round(sum(m.views for m in metrics), 0),
            "overall_roi": round(
                sum(m.emv for m in metrics) / sum(m.creator_rate for m in metrics)
                if sum(m.creator_rate for m in metrics) > 0 else 0,
                2
            ),
        }

        return {
            "success": True,
            "campaign_name": campaign_name or file.filename,
            "platform": detected_platform.value,
            "generated_at": datetime.utcnow().isoformat(),

            # Health Report
            "data_health": {
                "score": health_report.health_score,
                "explanation": health_report.score_explanation,
                "issues_count": len(health_report.issues),
                "critical_issues": health_report.critical_count,
            },

            # Metrics
            "campaign_totals": totals,
            "creator_metrics": [m.model_dump() for m in metrics],

            # Benchmarks
            "performance_distribution": {
                "overperforming": benchmark_result.overperforming_count,
                "expected": benchmark_result.expected_count,
                "underperforming": benchmark_result.underperforming_count,
            },
            "creator_classifications": [
                c.model_dump() for c in benchmark_result.creator_classifications
            ],
            "benchmark_insights": benchmark_result.insights_summary,

            # Anomalies & Drivers
            "concentration_analysis": driver_analysis.top_performer_concentration,
            "top_performers": driver_analysis.top_n_creators,
            "best_genre": driver_analysis.best_genre,
            "best_genre_roi": driver_analysis.best_genre_roi,
            "best_country": driver_analysis.best_country,
            "best_country_roi": driver_analysis.best_country_roi,
            "anomalies": [a.model_dump() for a in driver_analysis.anomalies],
            "executive_insight": driver_analysis.insight_summary,
        }

    except Exception as e:
        logger.error(f"Full analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "AFK Analytics Backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }
