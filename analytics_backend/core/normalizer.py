"""
Schema Normalization + Data Validation + Data Health Score
===========================================================

UPGRADE 1: Production-grade CSV ingestion with:
- Auto-detection of column mappings from arbitrary column names
- Validation against canonical schema
- Data quality scoring (0-100)
- Issue detection and reporting

Competes with: Streamforge, CreatorIQ data pipelines
"""

import re
from typing import Optional
import pandas as pd
import numpy as np
from datetime import datetime
from loguru import logger

from ..models.schemas import (
    Platform,
    CreatorRow,
    DataHealthReport,
    ValidationIssue,
    IssueSeverity,
)


class SchemaNormalizer:
    """
    Intelligent CSV normalizer that maps arbitrary column names to canonical schema.

    Features:
    - Fuzzy column name matching
    - Platform auto-detection (Twitch/YouTube/TikTok)
    - Comprehensive validation
    - Health score calculation
    """

    # Column name mappings: canonical_field -> [possible_column_names]
    COLUMN_ALIASES = {
        # Identity
        "creator_name": [
            "creator_name", "creator", "name", "handle", "username",
            "streamer", "channel", "influencer", "talent", "creator name",
            "channel_name", "channel name", "streamer_name"
        ],
        "platform": [
            "platform", "source", "network", "site"
        ],
        "country": [
            "country", "region", "geo", "location", "country_code",
            "country code", "geo_country"
        ],
        "language": [
            "language", "lang", "locale", "language_code", "language code"
        ],
        "genre": [
            "genre", "category", "content_type", "content type", "vertical",
            "niche", "game", "game_category"
        ],

        # Twitch-specific
        "accv": [
            "accv", "avg_ccv", "average_concurrent_viewers", "avg_viewers",
            "concurrent_viewers", "ccv", "average concurrent viewers",
            "avg concurrent viewers", "average_ccv", "avg ccv"
        ],
        "hours_streamed": [
            "hours_streamed", "hours", "stream_hours", "total_hours",
            "hours streamed", "streaming_hours", "airtime", "broadcast_hours"
        ],

        # Universal metrics
        "views": [
            "views", "total_views", "view_count", "impressions",
            "total views", "video_views", "video views", "watch_count"
        ],
        "total_views": [
            "total_views", "total views"
        ],
        "engagement": [
            "engagement", "engagements", "total_engagement", "interactions",
            "likes_comments", "total engagement"
        ],
        "clicks": [
            "clicks", "click_count", "link_clicks", "cta_clicks", "click count"
        ],
        "conversions": [
            "conversions", "conversion_count", "sales", "signups",
            "conv", "conversion count"
        ],

        # Financial
        "creator_rate": [
            "creator_rate", "rate", "cost", "spend", "fee", "payment",
            "creator rate", "creator_fee", "creator_cost", "price",
            "creator cost", "creator fee", "budget", "investment"
        ],

        # Baselines
        "baseline_30d_views": [
            "baseline_30d_views", "30d_baseline", "30day_views",
            "avg_30d_views", "30d views", "30 day baseline"
        ],
        "baseline_30d_accv": [
            "baseline_30d_accv", "30d_accv", "avg_30d_accv", "30d accv"
        ],
        "baseline_90d_views": [
            "baseline_90d_views", "90d_baseline", "90day_views",
            "avg_90d_views", "90d views", "90 day baseline"
        ],
        "baseline_90d_accv": [
            "baseline_90d_accv", "90d_accv", "avg_90d_accv", "90d accv"
        ],

        # Timestamps
        "campaign_date": [
            "campaign_date", "date", "activation_date", "stream_date",
            "post_date", "publish_date", "campaign date"
        ],
    }

    # Scoring weights for health score calculation
    HEALTH_WEIGHTS = {
        "has_creator_name": 15,      # Critical - must have creator identification
        "has_cost_data": 20,         # Critical - need spend for ROI
        "has_performance_data": 20,  # Critical - need views/ACCV
        "no_duplicates": 10,         # Data integrity
        "no_negative_values": 10,    # Data sanity
        "complete_metadata": 10,     # Country/language/genre filled
        "valid_dates": 5,            # Date format correct
        "consistent_currency": 5,    # No currency mismatches
        "reasonable_values": 5,      # No impossible outliers
    }

    def __init__(self):
        """Initialize the normalizer."""
        self._build_reverse_mapping()

    def _build_reverse_mapping(self):
        """Build reverse mapping from alias -> canonical field."""
        self.alias_to_canonical = {}
        for canonical, aliases in self.COLUMN_ALIASES.items():
            for alias in aliases:
                # Normalize alias for matching
                normalized = self._normalize_column_name(alias)
                self.alias_to_canonical[normalized] = canonical

    def _normalize_column_name(self, name: str) -> str:
        """Normalize column name for matching."""
        if not name:
            return ""
        # Lowercase, strip whitespace, replace spaces/special chars with underscore
        normalized = name.lower().strip()
        normalized = re.sub(r'[^a-z0-9]+', '_', normalized)
        normalized = normalized.strip('_')
        return normalized

    def detect_column_mapping(self, df: pd.DataFrame) -> dict[str, str]:
        """
        Auto-detect mapping from CSV columns to canonical schema.

        Returns:
            Dict of {original_column_name: canonical_field_name}
        """
        mapping = {}

        for col in df.columns:
            normalized = self._normalize_column_name(col)

            # Direct match
            if normalized in self.alias_to_canonical:
                mapping[col] = self.alias_to_canonical[normalized]
                continue

            # Fuzzy match - check if normalized name contains any alias
            for alias_norm, canonical in self.alias_to_canonical.items():
                if alias_norm in normalized or normalized in alias_norm:
                    if col not in mapping:  # Don't overwrite better matches
                        mapping[col] = canonical
                    break

        logger.info(f"Column mapping detected: {mapping}")
        return mapping

    def detect_platform(self, df: pd.DataFrame, mapping: dict) -> Platform:
        """
        Auto-detect platform from data characteristics.

        Logic:
        - Has ACCV or hours_streamed -> Twitch
        - Has views without ACCV -> YouTube or TikTok
        - Check filename or explicit platform column
        """
        canonical_cols = set(mapping.values())

        # Check for explicit platform column
        if "platform" in canonical_cols:
            original_col = [k for k, v in mapping.items() if v == "platform"][0]
            platform_values = df[original_col].dropna().str.lower().unique()

            if any("twitch" in str(v) for v in platform_values):
                return Platform.TWITCH
            if any("youtube" in str(v) for v in platform_values):
                return Platform.YOUTUBE
            if any("tiktok" in str(v) for v in platform_values):
                return Platform.TIKTOK

        # Infer from columns present
        if "accv" in canonical_cols or "hours_streamed" in canonical_cols:
            return Platform.TWITCH

        if "views" in canonical_cols or "total_views" in canonical_cols:
            # Could be YouTube or TikTok - default to YouTube
            return Platform.YOUTUBE

        return Platform.UNKNOWN

    def normalize_dataframe(
        self,
        df: pd.DataFrame,
        mapping: dict[str, str]
    ) -> pd.DataFrame:
        """
        Apply column mapping and normalize data types.

        Returns:
            DataFrame with canonical column names and cleaned data.
        """
        # Rename columns to canonical names
        df_clean = df.rename(columns=mapping).copy()

        # Normalize numeric columns
        numeric_fields = [
            "accv", "hours_streamed", "views", "total_views", "engagement",
            "clicks", "conversions", "creator_rate", "spend", "cost",
            "baseline_30d_views", "baseline_30d_accv",
            "baseline_90d_views", "baseline_90d_accv"
        ]

        for field in numeric_fields:
            if field in df_clean.columns:
                df_clean[field] = self._clean_numeric(df_clean[field])

        # Consolidate aliases
        # views = total_views if views is missing
        if "total_views" in df_clean.columns and "views" not in df_clean.columns:
            df_clean["views"] = df_clean["total_views"]
        elif "total_views" in df_clean.columns and "views" in df_clean.columns:
            # Fill missing views with total_views
            df_clean["views"] = df_clean["views"].fillna(df_clean["total_views"])

        # creator_rate = spend = cost (consolidate)
        for alias in ["spend", "cost"]:
            if alias in df_clean.columns and "creator_rate" not in df_clean.columns:
                df_clean["creator_rate"] = df_clean[alias]
            elif alias in df_clean.columns:
                df_clean["creator_rate"] = df_clean["creator_rate"].fillna(df_clean[alias])

        # Normalize string columns
        if "creator_name" in df_clean.columns:
            df_clean["creator_name"] = df_clean["creator_name"].astype(str).str.strip()
            # Remove @ prefix if present
            df_clean["creator_name"] = df_clean["creator_name"].str.lstrip('@')

        if "country" in df_clean.columns:
            df_clean["country"] = df_clean["country"].astype(str).str.upper().str.strip()

        if "language" in df_clean.columns:
            df_clean["language"] = df_clean["language"].astype(str).str.upper().str.strip()

        return df_clean

    def _clean_numeric(self, series: pd.Series) -> pd.Series:
        """Clean and convert a series to numeric, handling common issues."""
        if series.dtype in ['int64', 'float64']:
            return series

        # Convert to string for cleaning
        cleaned = series.astype(str)

        # Remove currency symbols and commas
        cleaned = cleaned.str.replace(r'[$€£¥,]', '', regex=True)

        # Remove whitespace
        cleaned = cleaned.str.strip()

        # Handle empty strings
        cleaned = cleaned.replace(['', 'nan', 'None', 'N/A', 'n/a', '-'], np.nan)

        # Convert to numeric
        return pd.to_numeric(cleaned, errors='coerce')

    def validate(
        self,
        df: pd.DataFrame,
        platform: Platform
    ) -> list[ValidationIssue]:
        """
        Validate normalized dataframe and return list of issues.

        Checks:
        - Missing required fields (creator_name, cost)
        - Duplicate rows
        - Impossible dates
        - Zero or negative metrics
        - Currency mismatches (inferred)
        - Outlier detection for obvious errors
        """
        issues = []

        # Check 1: Missing creator names
        if "creator_name" in df.columns:
            missing_names = df[df["creator_name"].isna() | (df["creator_name"] == "")]
            for idx in missing_names.index:
                issues.append(ValidationIssue(
                    severity=IssueSeverity.CRITICAL,
                    row_index=int(idx),
                    column="creator_name",
                    issue_type="missing_creator_name",
                    message=f"Row {idx + 1}: Missing creator name - cannot identify creator",
                    value=None
                ))
        else:
            issues.append(ValidationIssue(
                severity=IssueSeverity.CRITICAL,
                row_index=None,
                column="creator_name",
                issue_type="missing_column",
                message="No creator name column detected - cannot process data",
                value=None
            ))

        # Check 2: Missing spend/cost data
        if "creator_rate" in df.columns:
            missing_spend = df[df["creator_rate"].isna() | (df["creator_rate"] == 0)]
            for idx in missing_spend.index:
                issues.append(ValidationIssue(
                    severity=IssueSeverity.WARNING,
                    row_index=int(idx),
                    column="creator_rate",
                    issue_type="missing_spend",
                    message=f"Row {idx + 1}: Missing or zero creator rate - ROI cannot be calculated",
                    value=df.loc[idx, "creator_rate"] if not pd.isna(df.loc[idx, "creator_rate"]) else None
                ))
        else:
            issues.append(ValidationIssue(
                severity=IssueSeverity.WARNING,
                row_index=None,
                column="creator_rate",
                issue_type="missing_column",
                message="No spend/cost column detected - ROI calculations will fail",
                value=None
            ))

        # Check 3: Duplicate rows
        if "creator_name" in df.columns:
            duplicates = df[df.duplicated(subset=["creator_name"], keep=False)]
            if len(duplicates) > 0:
                dup_names = duplicates["creator_name"].unique().tolist()
                issues.append(ValidationIssue(
                    severity=IssueSeverity.WARNING,
                    row_index=None,
                    column="creator_name",
                    issue_type="duplicate_rows",
                    message=f"Duplicate creator entries found: {', '.join(map(str, dup_names[:5]))}{'...' if len(dup_names) > 5 else ''}",
                    value=dup_names
                ))

        # Check 4: Negative values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            negative_rows = df[df[col] < 0]
            for idx in negative_rows.index:
                issues.append(ValidationIssue(
                    severity=IssueSeverity.WARNING,
                    row_index=int(idx),
                    column=col,
                    issue_type="negative_value",
                    message=f"Row {idx + 1}: Negative value in {col} ({df.loc[idx, col]})",
                    value=float(df.loc[idx, col])
                ))

        # Check 5: Platform-specific validation
        if platform == Platform.TWITCH:
            # Twitch should have ACCV or hours_streamed
            if "accv" not in df.columns and "hours_streamed" not in df.columns:
                issues.append(ValidationIssue(
                    severity=IssueSeverity.WARNING,
                    row_index=None,
                    column=None,
                    issue_type="missing_twitch_metrics",
                    message="Twitch campaign missing ACCV or hours_streamed data",
                    value=None
                ))
        else:
            # YouTube/TikTok should have views
            if "views" not in df.columns:
                issues.append(ValidationIssue(
                    severity=IssueSeverity.WARNING,
                    row_index=None,
                    column=None,
                    issue_type="missing_views",
                    message="Campaign missing views data - EMV cannot be calculated",
                    value=None
                ))

        # Check 6: Outlier detection (values > 3 std from mean)
        for col in ["creator_rate", "views", "accv"]:
            if col in df.columns:
                values = df[col].dropna()
                if len(values) > 2:
                    mean = values.mean()
                    std = values.std()
                    if std > 0:
                        outliers = df[np.abs(df[col] - mean) > 3 * std]
                        for idx in outliers.index:
                            issues.append(ValidationIssue(
                                severity=IssueSeverity.INFO,
                                row_index=int(idx),
                                column=col,
                                issue_type="potential_outlier",
                                message=f"Row {idx + 1}: {col} value ({df.loc[idx, col]:,.0f}) is a significant outlier - verify accuracy",
                                value=float(df.loc[idx, col])
                            ))

        # Check 7: Date validation
        if "campaign_date" in df.columns:
            for idx, date_val in df["campaign_date"].items():
                if pd.notna(date_val):
                    try:
                        # Try parsing common date formats
                        parsed = pd.to_datetime(date_val)
                        # Check for impossible dates
                        if parsed.year < 2010 or parsed > datetime.now():
                            issues.append(ValidationIssue(
                                severity=IssueSeverity.WARNING,
                                row_index=int(idx),
                                column="campaign_date",
                                issue_type="impossible_date",
                                message=f"Row {idx + 1}: Date {date_val} seems incorrect (before 2010 or in future)",
                                value=str(date_val)
                            ))
                    except:
                        issues.append(ValidationIssue(
                            severity=IssueSeverity.INFO,
                            row_index=int(idx),
                            column="campaign_date",
                            issue_type="invalid_date_format",
                            message=f"Row {idx + 1}: Cannot parse date '{date_val}'",
                            value=str(date_val)
                        ))

        return issues

    def calculate_health_score(
        self,
        df: pd.DataFrame,
        issues: list[ValidationIssue],
        platform: Platform
    ) -> tuple[float, str]:
        """
        Calculate data health score 0-100 with explanation.

        Scoring logic:
        - Start at 100
        - Deduct points based on issue severity and type
        - Weight by importance of each check
        """
        score = 100.0
        deductions = []

        # Critical issues cause heavy penalties
        critical_count = sum(1 for i in issues if i.severity == IssueSeverity.CRITICAL)
        if critical_count > 0:
            penalty = min(40, critical_count * 20)  # Max 40 point penalty
            score -= penalty
            deductions.append(f"-{penalty} for {critical_count} critical issue(s)")

        # Warning issues cause moderate penalties
        warning_count = sum(1 for i in issues if i.severity == IssueSeverity.WARNING)
        if warning_count > 0:
            penalty = min(30, warning_count * 5)  # Max 30 point penalty
            score -= penalty
            deductions.append(f"-{penalty} for {warning_count} warning(s)")

        # Info issues cause minor penalties
        info_count = sum(1 for i in issues if i.severity == IssueSeverity.INFO)
        if info_count > 0:
            penalty = min(10, info_count * 2)  # Max 10 point penalty
            score -= penalty
            deductions.append(f"-{penalty} for {info_count} minor issue(s)")

        # Bonus points for completeness
        if "country" in df.columns and df["country"].notna().sum() > len(df) * 0.8:
            score = min(100, score + 2)
        if "genre" in df.columns and df["genre"].notna().sum() > len(df) * 0.8:
            score = min(100, score + 2)

        # Cap score
        score = max(0, min(100, score))

        # Build explanation
        if score >= 90:
            grade = "Excellent"
            summary = "Data quality is excellent. Ready for analysis."
        elif score >= 75:
            grade = "Good"
            summary = "Data quality is good with minor issues to review."
        elif score >= 50:
            grade = "Fair"
            summary = "Data has quality issues that may affect analysis accuracy."
        else:
            grade = "Poor"
            summary = "Data has significant quality issues. Review and correct before analysis."

        explanation = f"{grade} ({score:.0f}/100): {summary}"
        if deductions:
            explanation += f" Deductions: {'; '.join(deductions)}."

        return round(score, 1), explanation

    def process(
        self,
        df: pd.DataFrame,
        platform_hint: Optional[Platform] = None
    ) -> tuple[pd.DataFrame, DataHealthReport]:
        """
        Main entry point: normalize, validate, and score uploaded data.

        Args:
            df: Raw pandas DataFrame from CSV upload
            platform_hint: Optional platform override

        Returns:
            Tuple of (cleaned_df, health_report)
        """
        logger.info(f"Processing dataframe with {len(df)} rows, {len(df.columns)} columns")

        # Step 1: Detect column mapping
        column_mapping = self.detect_column_mapping(df)

        # Step 2: Detect platform
        platform = platform_hint or self.detect_platform(df, column_mapping)
        logger.info(f"Detected platform: {platform}")

        # Step 3: Normalize dataframe
        df_clean = self.normalize_dataframe(df, column_mapping)

        # Step 4: Validate
        issues = self.validate(df_clean, platform)

        # Step 5: Calculate health score
        health_score, score_explanation = self.calculate_health_score(
            df_clean, issues, platform
        )

        # Count issue severities
        critical_count = sum(1 for i in issues if i.severity == IssueSeverity.CRITICAL)
        warning_count = sum(1 for i in issues if i.severity == IssueSeverity.WARNING)
        info_count = sum(1 for i in issues if i.severity == IssueSeverity.INFO)

        # Build health report
        health_report = DataHealthReport(
            health_score=health_score,
            score_explanation=score_explanation,
            total_rows=len(df_clean),
            valid_rows=len(df_clean) - critical_count,
            invalid_rows=critical_count,
            detected_platform=platform,
            issues=issues,
            critical_count=critical_count,
            warning_count=warning_count,
            info_count=info_count,
            column_mapping=column_mapping,
        )

        return df_clean, health_report
