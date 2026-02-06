"""
Baseline Benchmarking Engine
============================

UPGRADE 2: Performance benchmarking system that:
- Calculates standardized KPIs (CPV, CPM, CPWH, CTR, conversion rate)
- Compares against 30-day and 90-day creator baselines
- Compares against cohort median (platform + content type)
- Classifies creators as Overperforming / Expected / Underperforming
- Generates structured insights and plain-English summaries

Baselines can come from:
- SullyGnome API (Twitch) - to be integrated
- Manual entry in CSV (YouTube/TikTok)
- Historical campaign data
"""

from typing import Optional
import pandas as pd
import numpy as np
from loguru import logger

from ..models.schemas import (
    Platform,
    CreatorMetrics,
    PerformanceClass,
    PerformanceClassification,
    BenchmarkResult,
)


class BenchmarkingEngine:
    """
    Benchmarking engine for creator performance analysis.

    Compares individual creator performance against:
    1. Their own historical baselines (30-day, 90-day)
    2. Cohort performance (same platform + genre)
    3. Campaign-wide averages
    """

    # EMV rates by platform (USD per 1000 views)
    EMV_RATES = {
        Platform.TWITCH: 1.2,      # $1.2 per hour watched
        Platform.YOUTUBE: 100.0,   # $100 per 1000 views
        Platform.TIKTOK: 30.0,     # $30 per 1000 views
    }

    # Performance thresholds for classification
    THRESHOLDS = {
        "overperforming": 1.25,   # 25% above expected
        "underperforming": 0.75,  # 25% below expected
    }

    def __init__(self):
        """Initialize benchmarking engine."""
        pass

    def calculate_metrics(
        self,
        df: pd.DataFrame,
        platform: Platform
    ) -> list[CreatorMetrics]:
        """
        Calculate standardized metrics for each creator.

        Metrics calculated:
        - EMV: Estimated Media Value
        - ROI: EMV / creator_rate
        - CPV: Cost Per View
        - CPM: Cost Per Mille (1000 views)
        - CPWH: Cost Per Watch Hour (Twitch only)
        - CTR: Click-Through Rate
        - Conversion Rate
        - Engagement Rate
        """
        metrics_list = []

        for idx, row in df.iterrows():
            creator_name = row.get("creator_name", f"Creator_{idx}")

            # Extract raw values
            views = float(row.get("views", 0) or 0)
            accv = float(row.get("accv", 0) or 0)
            hours_streamed = float(row.get("hours_streamed", 0) or 0)
            creator_rate = float(row.get("creator_rate", 0) or 0)
            engagement = float(row.get("engagement", 0) or 0)
            clicks = float(row.get("clicks", 0) or 0)
            conversions = float(row.get("conversions", 0) or 0)

            # Calculate platform-specific metrics
            if platform == Platform.TWITCH:
                # Twitch: Hours watched = ACCV × Hours streamed
                hours_watched = accv * hours_streamed
                # Views = Hours watched × 12 (estimated)
                if views == 0:
                    views = hours_watched * 12
                # EMV = Hours watched × $1.2
                emv = hours_watched * self.EMV_RATES[Platform.TWITCH]
            else:
                hours_watched = 0
                # YouTube: EMV = Views × $100 / 1000
                # TikTok: EMV = Views × $30 / 1000
                rate = self.EMV_RATES.get(platform, 100.0)
                emv = (views / 1000) * rate

            # Calculate ROI
            roi = emv / creator_rate if creator_rate > 0 else 0

            # Calculate efficiency metrics
            cpv = creator_rate / views if views > 0 else None
            cpm = (creator_rate / views) * 1000 if views > 0 else None
            cpwh = creator_rate / hours_watched if hours_watched > 0 else None
            ctr = (clicks / views) * 100 if views > 0 and clicks > 0 else None
            conversion_rate = (conversions / clicks) * 100 if clicks > 0 and conversions > 0 else None
            engagement_rate = (engagement / views) * 100 if views > 0 and engagement > 0 else None

            metrics = CreatorMetrics(
                creator_name=creator_name,
                platform=platform,
                views=round(views, 2),
                hours_watched=round(hours_watched, 2),
                emv=round(emv, 2),
                creator_rate=round(creator_rate, 2),
                roi=round(roi, 2),
                cpv=round(cpv, 6) if cpv else None,
                cpm=round(cpm, 2) if cpm else None,
                cpwh=round(cpwh, 2) if cpwh else None,
                ctr=round(ctr, 2) if ctr else None,
                conversion_rate=round(conversion_rate, 2) if conversion_rate else None,
                engagement_rate=round(engagement_rate, 2) if engagement_rate else None,
                accv=accv if accv > 0 else None,
                hours_streamed=hours_streamed if hours_streamed > 0 else None,
                engagement=engagement if engagement > 0 else None,
                clicks=clicks if clicks > 0 else None,
                conversions=conversions if conversions > 0 else None,
                country=row.get("country"),
                language=row.get("language"),
                genre=row.get("genre"),
            )

            metrics_list.append(metrics)

        logger.info(f"Calculated metrics for {len(metrics_list)} creators")
        return metrics_list

    def calculate_cohort_stats(
        self,
        metrics: list[CreatorMetrics],
        group_by: str = "genre"
    ) -> dict:
        """
        Calculate cohort statistics for benchmarking.

        Groups creators by platform + group_by field (genre, country, etc.)
        and calculates median values for comparison.
        """
        cohorts = {}

        for m in metrics:
            # Build cohort key
            group_value = getattr(m, group_by, "Unknown") or "Unknown"
            cohort_key = f"{m.platform.value}_{group_value}"

            if cohort_key not in cohorts:
                cohorts[cohort_key] = {
                    "roi_values": [],
                    "emv_values": [],
                    "cpm_values": [],
                    "cpv_values": [],
                    "creators": [],
                }

            cohorts[cohort_key]["roi_values"].append(m.roi)
            cohorts[cohort_key]["emv_values"].append(m.emv)
            if m.cpm:
                cohorts[cohort_key]["cpm_values"].append(m.cpm)
            if m.cpv:
                cohorts[cohort_key]["cpv_values"].append(m.cpv)
            cohorts[cohort_key]["creators"].append(m.creator_name)

        # Calculate medians
        cohort_stats = {}
        for key, data in cohorts.items():
            cohort_stats[key] = {
                "median_roi": float(np.median(data["roi_values"])) if data["roi_values"] else 0,
                "median_emv": float(np.median(data["emv_values"])) if data["emv_values"] else 0,
                "median_cpm": float(np.median(data["cpm_values"])) if data["cpm_values"] else None,
                "median_cpv": float(np.median(data["cpv_values"])) if data["cpv_values"] else None,
                "creator_count": len(data["creators"]),
            }

        return cohort_stats

    def classify_creator(
        self,
        creator: CreatorMetrics,
        df_row: pd.Series,
        cohort_stats: dict,
        all_metrics: list[CreatorMetrics]
    ) -> PerformanceClassification:
        """
        Classify a creator's performance against baselines and cohort.

        Classification logic:
        1. Compare to 30-day baseline (if available)
        2. Compare to 90-day baseline (if available)
        3. Compare to cohort median
        4. Weighted decision: 40% baseline, 40% cohort, 20% absolute ROI
        """
        # Get baseline values from data
        baseline_30d = df_row.get("baseline_30d_views") or df_row.get("baseline_30d_accv")
        baseline_90d = df_row.get("baseline_90d_views") or df_row.get("baseline_90d_accv")

        # Get cohort median
        group_value = creator.genre or "Unknown"
        cohort_key = f"{creator.platform.value}_{group_value}"
        cohort_data = cohort_stats.get(cohort_key, {})
        cohort_median_roi = cohort_data.get("median_roi", 0)

        # Calculate variances
        vs_30d = None
        vs_90d = None
        vs_cohort = None

        # Baseline comparison (views or ACCV depending on platform)
        if baseline_30d and baseline_30d > 0:
            current = creator.views if creator.views > 0 else (creator.accv or 0)
            vs_30d = ((current - baseline_30d) / baseline_30d) * 100

        if baseline_90d and baseline_90d > 0:
            current = creator.views if creator.views > 0 else (creator.accv or 0)
            vs_90d = ((current - baseline_90d) / baseline_90d) * 100

        if cohort_median_roi > 0:
            vs_cohort = ((creator.roi - cohort_median_roi) / cohort_median_roi) * 100

        # Calculate percentiles
        all_rois = [m.roi for m in all_metrics if m.roi > 0]
        all_emvs = [m.emv for m in all_metrics]

        roi_percentile = None
        emv_percentile = None

        if all_rois:
            roi_percentile = (sum(1 for r in all_rois if r <= creator.roi) / len(all_rois)) * 100
        if all_emvs:
            emv_percentile = (sum(1 for e in all_emvs if e <= creator.emv) / len(all_emvs)) * 100

        # Determine classification
        # Use weighted scoring: baseline, cohort, absolute
        score = 0
        weights_used = 0

        if vs_30d is not None:
            score += (vs_30d / 100) * 0.2
            weights_used += 0.2
        if vs_90d is not None:
            score += (vs_90d / 100) * 0.2
            weights_used += 0.2
        if vs_cohort is not None:
            score += (vs_cohort / 100) * 0.4
            weights_used += 0.4

        # Absolute ROI component
        if creator.roi >= 1.5:
            score += 0.3 * 0.2
        elif creator.roi >= 1.0:
            score += 0.1 * 0.2
        elif creator.roi < 0.8:
            score -= 0.2 * 0.2
        weights_used += 0.2

        # Normalize score
        if weights_used > 0:
            normalized_score = score / weights_used
        else:
            normalized_score = 0

        # Classify based on score
        if normalized_score >= 0.25:
            classification = PerformanceClass.OVERPERFORMING
            rationale = self._build_rationale(creator, vs_30d, vs_90d, vs_cohort, "exceeded expectations")
        elif normalized_score <= -0.25:
            classification = PerformanceClass.UNDERPERFORMING
            rationale = self._build_rationale(creator, vs_30d, vs_90d, vs_cohort, "fell below expectations")
        else:
            classification = PerformanceClass.EXPECTED
            rationale = self._build_rationale(creator, vs_30d, vs_90d, vs_cohort, "performed as expected")

        return PerformanceClassification(
            creator_name=creator.creator_name,
            classification=classification,
            vs_30d_baseline=round(vs_30d, 1) if vs_30d else None,
            vs_90d_baseline=round(vs_90d, 1) if vs_90d else None,
            vs_cohort_median=round(vs_cohort, 1) if vs_cohort else None,
            roi_percentile=round(roi_percentile, 1) if roi_percentile else None,
            emv_percentile=round(emv_percentile, 1) if emv_percentile else None,
            rationale=rationale,
        )

    def _build_rationale(
        self,
        creator: CreatorMetrics,
        vs_30d: Optional[float],
        vs_90d: Optional[float],
        vs_cohort: Optional[float],
        verdict: str
    ) -> str:
        """Build human-readable rationale for classification."""
        parts = [f"{creator.creator_name} {verdict} with {creator.roi:.2f}x ROI."]

        if vs_30d is not None:
            direction = "above" if vs_30d > 0 else "below"
            parts.append(f"{abs(vs_30d):.1f}% {direction} 30-day baseline.")

        if vs_90d is not None:
            direction = "above" if vs_90d > 0 else "below"
            parts.append(f"{abs(vs_90d):.1f}% {direction} 90-day baseline.")

        if vs_cohort is not None:
            direction = "above" if vs_cohort > 0 else "below"
            parts.append(f"{abs(vs_cohort):.1f}% {direction} cohort median.")

        return " ".join(parts)

    def generate_insights(
        self,
        metrics: list[CreatorMetrics],
        classifications: list[PerformanceClassification],
        cohort_stats: dict
    ) -> tuple[dict, str]:
        """
        Generate structured insights and plain-English summary.

        Returns:
            Tuple of (insights_json, summary_text)
        """
        # Count classifications
        over_count = sum(1 for c in classifications if c.classification == PerformanceClass.OVERPERFORMING)
        expected_count = sum(1 for c in classifications if c.classification == PerformanceClass.EXPECTED)
        under_count = sum(1 for c in classifications if c.classification == PerformanceClass.UNDERPERFORMING)

        total = len(classifications)

        # Find top and bottom performers
        sorted_by_roi = sorted(metrics, key=lambda m: m.roi, reverse=True)
        top_performers = sorted_by_roi[:3]
        bottom_performers = sorted_by_roi[-3:] if len(sorted_by_roi) >= 3 else []

        # Calculate totals
        total_spend = sum(m.creator_rate for m in metrics)
        total_emv = sum(m.emv for m in metrics)
        overall_roi = total_emv / total_spend if total_spend > 0 else 0

        # Build insights JSON
        insights = {
            "performance_distribution": {
                "overperforming": over_count,
                "expected": expected_count,
                "underperforming": under_count,
                "total": total,
            },
            "top_performers": [
                {
                    "name": m.creator_name,
                    "roi": m.roi,
                    "emv": m.emv,
                    "genre": m.genre,
                }
                for m in top_performers
            ],
            "efficiency_drivers": {
                "highest_roi_genre": self._find_best_cohort(cohort_stats, "median_roi"),
                "lowest_cpm_genre": self._find_best_cohort(cohort_stats, "median_cpm", lowest=True),
            },
            "campaign_totals": {
                "total_spend": round(total_spend, 2),
                "total_emv": round(total_emv, 2),
                "overall_roi": round(overall_roi, 2),
            },
        }

        # Build summary text
        summary_parts = [
            f"Campaign Performance Summary: {total} creators analyzed.",
            f"\n\n**Performance Distribution:**",
            f"- {over_count} ({over_count/total*100:.0f}%) overperforming",
            f"- {expected_count} ({expected_count/total*100:.0f}%) performing as expected",
            f"- {under_count} ({under_count/total*100:.0f}%) underperforming",
        ]

        if top_performers:
            summary_parts.append(f"\n\n**Top Performers:**")
            for m in top_performers:
                summary_parts.append(f"- {m.creator_name}: {m.roi:.2f}x ROI, ${m.emv:,.2f} EMV")

        if bottom_performers and under_count > 0:
            summary_parts.append(f"\n\n**Needs Attention:**")
            for m in bottom_performers[:3]:
                if m.roi < 1:
                    summary_parts.append(f"- {m.creator_name}: {m.roi:.2f}x ROI - consider renegotiating terms")

        summary_parts.append(f"\n\n**Overall Campaign ROI:** {overall_roi:.2f}x")
        summary_parts.append(f"**Total Spend:** ${total_spend:,.2f}")
        summary_parts.append(f"**Total EMV Generated:** ${total_emv:,.2f}")

        summary = "\n".join(summary_parts)

        return insights, summary

    def _find_best_cohort(
        self,
        cohort_stats: dict,
        metric: str,
        lowest: bool = False
    ) -> Optional[dict]:
        """Find the best performing cohort by a given metric."""
        valid_cohorts = [
            (k, v) for k, v in cohort_stats.items()
            if v.get(metric) is not None and v.get(metric) > 0
        ]

        if not valid_cohorts:
            return None

        if lowest:
            best = min(valid_cohorts, key=lambda x: x[1][metric])
        else:
            best = max(valid_cohorts, key=lambda x: x[1][metric])

        return {
            "cohort": best[0],
            "value": best[1][metric],
        }

    def run_benchmark(
        self,
        df: pd.DataFrame,
        platform: Platform
    ) -> BenchmarkResult:
        """
        Main entry point: run complete benchmark analysis.

        Args:
            df: Normalized campaign dataframe
            platform: Detected platform

        Returns:
            Complete BenchmarkResult with classifications and insights
        """
        logger.info(f"Running benchmark for {len(df)} creators on {platform.value}")

        # Step 1: Calculate metrics
        metrics = self.calculate_metrics(df, platform)

        # Step 2: Calculate cohort statistics
        cohort_stats = self.calculate_cohort_stats(metrics, group_by="genre")

        # Step 3: Classify each creator
        classifications = []
        for i, creator in enumerate(metrics):
            row = df.iloc[i]
            classification = self.classify_creator(
                creator, row, cohort_stats, metrics
            )
            classifications.append(classification)

        # Step 4: Generate insights
        insights, summary = self.generate_insights(metrics, classifications, cohort_stats)

        # Step 5: Calculate overall cohort medians
        all_rois = [m.roi for m in metrics if m.roi > 0]
        all_cpms = [m.cpm for m in metrics if m.cpm and m.cpm > 0]
        all_cpvs = [m.cpv for m in metrics if m.cpv and m.cpv > 0]

        # Build result
        result = BenchmarkResult(
            campaign_summary=insights["campaign_totals"],
            creator_classifications=classifications,
            cohort_median_roi=float(np.median(all_rois)) if all_rois else 0,
            cohort_median_cpm=float(np.median(all_cpms)) if all_cpms else None,
            cohort_median_cpv=float(np.median(all_cpvs)) if all_cpvs else None,
            overperforming_count=sum(1 for c in classifications if c.classification == PerformanceClass.OVERPERFORMING),
            expected_count=sum(1 for c in classifications if c.classification == PerformanceClass.EXPECTED),
            underperforming_count=sum(1 for c in classifications if c.classification == PerformanceClass.UNDERPERFORMING),
            insights_json=insights,
            insights_summary=summary,
        )

        return result
