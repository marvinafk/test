"""
Pydantic Schemas for AFK Analytics Backend
==========================================

Defines all data models for API requests/responses and internal data structures.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# ENUMS
# =============================================================================

class Platform(str, Enum):
    """Supported streaming/content platforms."""
    TWITCH = "twitch"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    UNKNOWN = "unknown"


class PerformanceClass(str, Enum):
    """Creator performance classification."""
    OVERPERFORMING = "overperforming"
    EXPECTED = "expected"
    UNDERPERFORMING = "underperforming"


class IssueSeverity(str, Enum):
    """Severity level for validation issues."""
    CRITICAL = "critical"  # Data cannot be processed
    WARNING = "warning"    # Data quality concern
    INFO = "info"          # Minor issue, auto-corrected


class AnomalySeverity(str, Enum):
    """Severity of detected anomalies."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# =============================================================================
# INPUT SCHEMAS
# =============================================================================

class CreatorRow(BaseModel):
    """
    Canonical schema for a creator data row.
    All fields are optional to allow flexible CSV ingestion with validation.
    """
    # Identity fields
    creator_name: Optional[str] = Field(None, description="Creator handle/name")
    platform: Optional[Platform] = Field(None, description="Platform (twitch/youtube/tiktok)")
    country: Optional[str] = Field(None, description="ISO country code (US, UK, DE)")
    language: Optional[str] = Field(None, description="ISO language code (EN, DE, FR)")
    genre: Optional[str] = Field(None, description="Content category/genre")

    # Twitch-specific metrics
    accv: Optional[float] = Field(None, ge=0, description="Average Concurrent Viewers")
    hours_streamed: Optional[float] = Field(None, ge=0, description="Total hours streamed")

    # Universal metrics
    views: Optional[float] = Field(None, ge=0, description="Total views")
    total_views: Optional[float] = Field(None, ge=0, description="Alias for views")
    engagement: Optional[float] = Field(None, ge=0, description="Total engagement (likes+comments)")
    clicks: Optional[float] = Field(None, ge=0, description="Click-through count")
    conversions: Optional[float] = Field(None, ge=0, description="Conversion count")

    # Financial metrics
    creator_rate: Optional[float] = Field(None, ge=0, description="Cost paid to creator (USD)")
    spend: Optional[float] = Field(None, ge=0, description="Alias for creator_rate")
    cost: Optional[float] = Field(None, ge=0, description="Alias for creator_rate")

    # Benchmark baselines (optional - can be fetched from API or entered manually)
    baseline_30d_views: Optional[float] = Field(None, description="30-day avg views baseline")
    baseline_30d_accv: Optional[float] = Field(None, description="30-day avg ACCV baseline")
    baseline_90d_views: Optional[float] = Field(None, description="90-day avg views baseline")
    baseline_90d_accv: Optional[float] = Field(None, description="90-day avg ACCV baseline")

    # Timestamps
    campaign_date: Optional[str] = Field(None, description="Campaign date (YYYY-MM-DD)")

    class Config:
        extra = "allow"  # Allow extra fields from messy CSVs


class CampaignUpload(BaseModel):
    """Request model for campaign CSV upload."""
    filename: str
    platform_hint: Optional[Platform] = None
    campaign_name: Optional[str] = None


# =============================================================================
# VALIDATION & HEALTH REPORT SCHEMAS
# =============================================================================

class ValidationIssue(BaseModel):
    """A single data quality issue detected during validation."""
    severity: IssueSeverity
    row_index: Optional[int] = Field(None, description="Row number (0-indexed)")
    column: Optional[str] = Field(None, description="Column name with issue")
    issue_type: str = Field(..., description="Type of issue (missing_spend, duplicate, etc.)")
    message: str = Field(..., description="Human-readable description")
    value: Optional[Any] = Field(None, description="The problematic value")


class DataHealthReport(BaseModel):
    """Complete data health assessment for uploaded campaign data."""
    # Score
    health_score: float = Field(..., ge=0, le=100, description="Overall data quality score 0-100")
    score_explanation: str = Field(..., description="Human-readable score explanation")

    # Stats
    total_rows: int
    valid_rows: int
    invalid_rows: int
    detected_platform: Platform

    # Issues breakdown
    issues: list[ValidationIssue]
    critical_count: int = 0
    warning_count: int = 0
    info_count: int = 0

    # Column mapping
    column_mapping: dict[str, str] = Field(
        default_factory=dict,
        description="Detected column name -> canonical field mapping"
    )


# =============================================================================
# METRICS SCHEMAS
# =============================================================================

class CreatorMetrics(BaseModel):
    """Calculated metrics for a single creator."""
    creator_name: str
    platform: Platform

    # Core metrics
    views: float = 0
    hours_watched: float = 0  # Twitch: ACCV * hours_streamed
    emv: float = 0            # Estimated Media Value
    creator_rate: float = 0
    roi: float = 0            # EMV / creator_rate

    # Efficiency metrics
    cpv: Optional[float] = Field(None, description="Cost Per View")
    cpm: Optional[float] = Field(None, description="Cost Per Mille (1000 views)")
    cpwh: Optional[float] = Field(None, description="Cost Per Watch Hour (Twitch)")
    ctr: Optional[float] = Field(None, description="Click-Through Rate")
    conversion_rate: Optional[float] = Field(None, description="Conversion Rate")
    engagement_rate: Optional[float] = Field(None, description="Engagement Rate")

    # Raw inputs preserved
    accv: Optional[float] = None
    hours_streamed: Optional[float] = None
    engagement: Optional[float] = None
    clicks: Optional[float] = None
    conversions: Optional[float] = None

    # Metadata
    country: Optional[str] = None
    language: Optional[str] = None
    genre: Optional[str] = None


# =============================================================================
# BENCHMARK SCHEMAS
# =============================================================================

class PerformanceClassification(BaseModel):
    """Performance classification for a creator against baselines."""
    creator_name: str
    classification: PerformanceClass

    # Variance from baselines
    vs_30d_baseline: Optional[float] = Field(None, description="% variance vs 30-day baseline")
    vs_90d_baseline: Optional[float] = Field(None, description="% variance vs 90-day baseline")
    vs_cohort_median: Optional[float] = Field(None, description="% variance vs cohort median")

    # Key metrics comparison
    roi_percentile: Optional[float] = Field(None, description="ROI percentile within cohort")
    emv_percentile: Optional[float] = Field(None, description="EMV percentile within cohort")

    # Explanation
    rationale: str = Field(..., description="Why this classification was assigned")


class BenchmarkResult(BaseModel):
    """Complete benchmark analysis for a campaign."""
    campaign_summary: dict
    creator_classifications: list[PerformanceClassification]

    # Cohort stats
    cohort_median_roi: float
    cohort_median_cpm: Optional[float] = None
    cohort_median_cpv: Optional[float] = None

    # Top-level insights
    overperforming_count: int
    expected_count: int
    underperforming_count: int

    # Generated insights
    insights_json: dict = Field(default_factory=dict)
    insights_summary: str = Field(..., description="Plain-English summary")


# =============================================================================
# ANOMALY DETECTION SCHEMAS
# =============================================================================

class AnomalyResult(BaseModel):
    """A detected anomaly in campaign data."""
    creator_name: Optional[str] = None
    metric: str = Field(..., description="Metric where anomaly detected")
    anomaly_type: str = Field(..., description="spike, dip, outlier, change_point")
    severity: AnomalySeverity
    severity_score: float = Field(..., ge=0, le=1, description="Normalized severity 0-1")

    # Values
    observed_value: float
    expected_value: Optional[float] = None
    deviation_pct: Optional[float] = None

    # Explanation
    likely_cause: str = Field(..., description="Hypothesized cause of anomaly")
    recommendation: str = Field(..., description="Suggested action")


class DriverAnalysis(BaseModel):
    """Analysis of what's driving campaign performance."""
    # Concentration analysis
    top_performer_concentration: str = Field(
        ...,
        description="e.g., 'Top 20% of creators generated 80% of EMV'"
    )
    top_n_creators: list[str]
    top_n_emv_share: float

    # Key drivers
    best_genre: Optional[str] = None
    best_genre_roi: Optional[float] = None
    best_country: Optional[str] = None
    best_country_roi: Optional[float] = None

    # Anomalies
    anomalies: list[AnomalyResult]

    # Generated summary
    insight_summary: str = Field(..., description="Client-ready paragraph")


# =============================================================================
# API RESPONSE SCHEMAS
# =============================================================================

class IngestResponse(BaseModel):
    """Response from /ingest endpoint."""
    success: bool
    message: str
    health_report: DataHealthReport
    cleaned_data: list[dict] = Field(default_factory=list)
    row_count: int


class MetricsResponse(BaseModel):
    """Response from /metrics endpoint."""
    success: bool
    campaign_totals: dict
    creator_metrics: list[CreatorMetrics]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class BenchmarkResponse(BaseModel):
    """Response from /benchmarks endpoint."""
    success: bool
    benchmark_result: BenchmarkResult
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class AnomalyResponse(BaseModel):
    """Response from /anomalies endpoint."""
    success: bool
    driver_analysis: DriverAnalysis
    generated_at: datetime = Field(default_factory=datetime.utcnow)
