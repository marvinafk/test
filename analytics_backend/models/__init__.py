"""
AFK Analytics Backend - Data Models
===================================

Pydantic models for request/response validation and data schemas.
"""

from .schemas import (
    # Input schemas
    CreatorRow,
    CampaignUpload,

    # Output schemas
    DataHealthReport,
    ValidationIssue,
    CreatorMetrics,
    BenchmarkResult,
    PerformanceClassification,
    AnomalyResult,
    DriverAnalysis,

    # API Response models
    IngestResponse,
    MetricsResponse,
    BenchmarkResponse,
    AnomalyResponse,
)

__all__ = [
    "CreatorRow",
    "CampaignUpload",
    "DataHealthReport",
    "ValidationIssue",
    "CreatorMetrics",
    "BenchmarkResult",
    "PerformanceClassification",
    "AnomalyResult",
    "DriverAnalysis",
    "IngestResponse",
    "MetricsResponse",
    "BenchmarkResponse",
    "AnomalyResponse",
]
