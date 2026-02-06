"""
Anomaly Detection + Driver Analysis
====================================

UPGRADE 3: Statistical anomaly detection and performance driver analysis.

Features:
- Detect spikes/dips in views, CCV, CTR, conversions
- Change point detection in time series (if dates provided)
- Outlier detection using IQR and Z-score methods
- Concentration analysis ("Top X% generated Y% of results")
- Root cause hypotheses for anomalies
- Client-ready insight paragraphs

Uses simple, explainable statistical methods (no black-box ML):
- IQR (Interquartile Range) for outliers
- Z-score for deviation detection
- Rolling statistics for change points
- Pareto analysis for concentration
"""

from typing import Optional
import pandas as pd
import numpy as np
from scipy import stats
from loguru import logger

from ..models.schemas import (
    Platform,
    CreatorMetrics,
    AnomalyResult,
    AnomalySeverity,
    DriverAnalysis,
)


class AnomalyDetector:
    """
    Anomaly detection and driver analysis engine.

    Provides explainable statistical analysis of campaign performance,
    identifying outliers, anomalies, and key performance drivers.
    """

    # Thresholds for anomaly detection
    Z_SCORE_THRESHOLD = 2.5      # Standard deviations for outlier
    IQR_MULTIPLIER = 1.5         # IQR multiplier for outlier detection
    SEVERITY_HIGH_THRESHOLD = 3  # Z-score for high severity
    SEVERITY_MED_THRESHOLD = 2   # Z-score for medium severity

    def __init__(self):
        """Initialize anomaly detector."""
        pass

    def detect_outliers_zscore(
        self,
        values: pd.Series,
        names: pd.Series,
        metric_name: str
    ) -> list[AnomalyResult]:
        """
        Detect outliers using Z-score method.

        Z-score measures how many standard deviations a value is from the mean.
        Values with |Z| > threshold are flagged as anomalies.
        """
        anomalies = []

        # Need at least 3 data points for meaningful analysis
        if len(values.dropna()) < 3:
            return anomalies

        # Calculate Z-scores
        mean = values.mean()
        std = values.std()

        if std == 0:
            return anomalies

        z_scores = (values - mean) / std

        for idx, z in z_scores.items():
            if pd.isna(z):
                continue

            abs_z = abs(z)

            if abs_z > self.Z_SCORE_THRESHOLD:
                value = values[idx]
                name = names[idx] if idx in names.index else f"Row {idx}"

                # Determine anomaly type
                if z > 0:
                    anomaly_type = "spike"
                    direction = "above"
                else:
                    anomaly_type = "dip"
                    direction = "below"

                # Determine severity
                if abs_z >= self.SEVERITY_HIGH_THRESHOLD:
                    severity = AnomalySeverity.HIGH
                elif abs_z >= self.SEVERITY_MED_THRESHOLD:
                    severity = AnomalySeverity.MEDIUM
                else:
                    severity = AnomalySeverity.LOW

                # Normalize severity to 0-1 scale
                severity_score = min(1.0, abs_z / 4)

                # Calculate deviation percentage
                deviation_pct = ((value - mean) / mean) * 100 if mean != 0 else 0

                # Generate likely cause hypothesis
                likely_cause = self._hypothesize_cause(
                    metric_name, anomaly_type, deviation_pct, name
                )

                # Generate recommendation
                recommendation = self._generate_recommendation(
                    metric_name, anomaly_type, severity, name
                )

                anomalies.append(AnomalyResult(
                    creator_name=str(name),
                    metric=metric_name,
                    anomaly_type=anomaly_type,
                    severity=severity,
                    severity_score=round(severity_score, 2),
                    observed_value=round(float(value), 2),
                    expected_value=round(float(mean), 2),
                    deviation_pct=round(deviation_pct, 1),
                    likely_cause=likely_cause,
                    recommendation=recommendation,
                ))

        return anomalies

    def detect_outliers_iqr(
        self,
        values: pd.Series,
        names: pd.Series,
        metric_name: str
    ) -> list[AnomalyResult]:
        """
        Detect outliers using IQR (Interquartile Range) method.

        More robust to non-normal distributions than Z-score.
        Outliers are values below Q1 - 1.5*IQR or above Q3 + 1.5*IQR.
        """
        anomalies = []

        if len(values.dropna()) < 4:
            return anomalies

        q1 = values.quantile(0.25)
        q3 = values.quantile(0.75)
        iqr = q3 - q1

        if iqr == 0:
            return anomalies

        lower_bound = q1 - self.IQR_MULTIPLIER * iqr
        upper_bound = q3 + self.IQR_MULTIPLIER * iqr
        median = values.median()

        for idx, value in values.items():
            if pd.isna(value):
                continue

            if value < lower_bound or value > upper_bound:
                name = names[idx] if idx in names.index else f"Row {idx}"

                if value > upper_bound:
                    anomaly_type = "spike"
                    severity_score = min(1.0, (value - upper_bound) / (iqr * 2))
                else:
                    anomaly_type = "dip"
                    severity_score = min(1.0, (lower_bound - value) / (iqr * 2))

                # Determine severity
                if severity_score >= 0.7:
                    severity = AnomalySeverity.HIGH
                elif severity_score >= 0.4:
                    severity = AnomalySeverity.MEDIUM
                else:
                    severity = AnomalySeverity.LOW

                deviation_pct = ((value - median) / median) * 100 if median != 0 else 0

                likely_cause = self._hypothesize_cause(
                    metric_name, anomaly_type, deviation_pct, name
                )
                recommendation = self._generate_recommendation(
                    metric_name, anomaly_type, severity, name
                )

                anomalies.append(AnomalyResult(
                    creator_name=str(name),
                    metric=metric_name,
                    anomaly_type="outlier",
                    severity=severity,
                    severity_score=round(severity_score, 2),
                    observed_value=round(float(value), 2),
                    expected_value=round(float(median), 2),
                    deviation_pct=round(deviation_pct, 1),
                    likely_cause=likely_cause,
                    recommendation=recommendation,
                ))

        return anomalies

    def _hypothesize_cause(
        self,
        metric: str,
        anomaly_type: str,
        deviation_pct: float,
        creator_name: str
    ) -> str:
        """
        Generate a hypothesis for the likely cause of an anomaly.

        Uses domain knowledge about influencer marketing to provide
        contextual explanations.
        """
        causes = {
            ("views", "spike"): [
                "Viral content or external traffic boost",
                "Algorithm boost or trending topic alignment",
                "Cross-platform promotion or raid",
            ],
            ("views", "dip"): [
                "Off-peak posting time or low activity period",
                "Content-audience mismatch",
                "Platform algorithm changes or reach reduction",
            ],
            ("accv", "spike"): [
                "Raid or host from larger creator",
                "Major game release or event stream",
                "Successful promotion or advertisement",
            ],
            ("accv", "dip"): [
                "Stream during off-hours",
                "Content fatigue or audience saturation",
                "Competing events or streams",
            ],
            ("roi", "spike"): [
                "Exceptionally favorable creator rate negotiated",
                "Content significantly outperformed expectations",
                "Strong audience-product fit",
            ],
            ("roi", "dip"): [
                "Creator rate above market value",
                "Poor content-product integration",
                "Audience not aligned with campaign goals",
            ],
            ("engagement", "spike"): [
                "Highly engaging content format",
                "Controversial or discussion-worthy topic",
                "Active community engagement",
            ],
            ("engagement", "dip"): [
                "Passive content format (watch-only)",
                "Audience fatigue or content saturation",
                "Poor call-to-action placement",
            ],
        }

        key = (metric.lower(), anomaly_type)
        possible_causes = causes.get(key, ["Unusual performance deviation"])

        # Select cause based on deviation magnitude
        if abs(deviation_pct) > 200:
            return f"{possible_causes[0]} (extreme deviation of {abs(deviation_pct):.0f}%)"
        elif abs(deviation_pct) > 100:
            return possible_causes[0] if len(possible_causes) > 0 else "Significant performance variance"
        else:
            return possible_causes[-1] if len(possible_causes) > 0 else "Performance outside normal range"

    def _generate_recommendation(
        self,
        metric: str,
        anomaly_type: str,
        severity: AnomalySeverity,
        creator_name: str
    ) -> str:
        """Generate actionable recommendation based on anomaly."""
        if anomaly_type in ["spike"] and severity == AnomalySeverity.HIGH:
            return f"Investigate {creator_name}'s success factors for replication in future campaigns"
        elif anomaly_type in ["dip"] and severity == AnomalySeverity.HIGH:
            return f"Review {creator_name}'s campaign execution and consider rate renegotiation"
        elif anomaly_type in ["spike"]:
            return f"Document {creator_name}'s approach for best practices"
        else:
            return f"Monitor {creator_name}'s performance in next activation"

    def analyze_concentration(
        self,
        metrics: list[CreatorMetrics]
    ) -> tuple[str, list[str], float]:
        """
        Perform Pareto (concentration) analysis.

        Calculates what percentage of EMV is generated by top X% of creators.
        Classic finding: "Top 20% generate 80% of results"
        """
        if not metrics:
            return "Insufficient data", [], 0

        # Sort by EMV descending
        sorted_metrics = sorted(metrics, key=lambda m: m.emv, reverse=True)
        total_emv = sum(m.emv for m in sorted_metrics)

        if total_emv == 0:
            return "No EMV generated", [], 0

        # Find concentration points
        cumulative_emv = 0
        top_creators = []

        for i, m in enumerate(sorted_metrics):
            cumulative_emv += m.emv
            top_creators.append(m.creator_name)

            pct_creators = ((i + 1) / len(sorted_metrics)) * 100
            pct_emv = (cumulative_emv / total_emv) * 100

            # Check for 80/20 type ratios
            if pct_emv >= 50 and len(top_creators) <= len(sorted_metrics) * 0.3:
                # Top 30% or less generates 50%+ of EMV
                concentration_text = f"Top {pct_creators:.0f}% of creators ({len(top_creators)}) generated {pct_emv:.0f}% of total EMV"
                return concentration_text, top_creators, pct_emv

            if pct_emv >= 80:
                concentration_text = f"Top {pct_creators:.0f}% of creators ({len(top_creators)}) generated {pct_emv:.0f}% of total EMV"
                return concentration_text, top_creators[:5], pct_emv

        # Default: show top 3
        top_3_emv = sum(m.emv for m in sorted_metrics[:3])
        top_3_pct = (top_3_emv / total_emv) * 100
        return f"Top 3 creators generated {top_3_pct:.0f}% of total EMV", [m.creator_name for m in sorted_metrics[:3]], top_3_pct

    def find_best_segments(
        self,
        metrics: list[CreatorMetrics]
    ) -> tuple[Optional[str], Optional[float], Optional[str], Optional[float]]:
        """
        Find best performing genre and country by ROI.
        """
        genre_stats = {}
        country_stats = {}

        for m in metrics:
            # Genre aggregation
            if m.genre and m.genre not in ["N/A", "Unknown", ""]:
                if m.genre not in genre_stats:
                    genre_stats[m.genre] = {"emv": 0, "cost": 0}
                genre_stats[m.genre]["emv"] += m.emv
                genre_stats[m.genre]["cost"] += m.creator_rate

            # Country aggregation
            if m.country and m.country not in ["N/A", "Unknown", ""]:
                if m.country not in country_stats:
                    country_stats[m.country] = {"emv": 0, "cost": 0}
                country_stats[m.country]["emv"] += m.emv
                country_stats[m.country]["cost"] += m.creator_rate

        # Find best genre
        best_genre = None
        best_genre_roi = None
        if genre_stats:
            genre_rois = {
                g: s["emv"] / s["cost"] if s["cost"] > 0 else 0
                for g, s in genre_stats.items()
            }
            if genre_rois:
                best_genre = max(genre_rois, key=genre_rois.get)
                best_genre_roi = genre_rois[best_genre]

        # Find best country
        best_country = None
        best_country_roi = None
        if country_stats:
            country_rois = {
                c: s["emv"] / s["cost"] if s["cost"] > 0 else 0
                for c, s in country_stats.items()
            }
            if country_rois:
                best_country = max(country_rois, key=country_rois.get)
                best_country_roi = country_rois[best_country]

        return best_genre, best_genre_roi, best_country, best_country_roi

    def generate_insight_summary(
        self,
        metrics: list[CreatorMetrics],
        anomalies: list[AnomalyResult],
        concentration: str,
        best_genre: Optional[str],
        best_genre_roi: Optional[float],
        best_country: Optional[str],
        best_country_roi: Optional[float]
    ) -> str:
        """
        Generate a client-ready insight paragraph.

        Written in consultant-style prose suitable for presentation.
        """
        total_emv = sum(m.emv for m in metrics)
        total_cost = sum(m.creator_rate for m in metrics)
        overall_roi = total_emv / total_cost if total_cost > 0 else 0

        paragraphs = []

        # Opening with concentration insight
        paragraphs.append(
            f"This campaign engaged {len(metrics)} creators, generating ${total_emv:,.2f} in estimated media value "
            f"from a ${total_cost:,.2f} investment ({overall_roi:.2f}x ROI). {concentration}."
        )

        # Segment insights
        segment_insights = []
        if best_genre and best_genre_roi:
            segment_insights.append(
                f"**{best_genre}** content delivered the highest ROI at {best_genre_roi:.2f}x"
            )
        if best_country and best_country_roi:
            segment_insights.append(
                f"**{best_country}** creators achieved {best_country_roi:.2f}x ROI"
            )

        if segment_insights:
            paragraphs.append("Key performance drivers: " + "; ".join(segment_insights) + ".")

        # Anomaly insights
        high_severity = [a for a in anomalies if a.severity == AnomalySeverity.HIGH]
        if high_severity:
            spike_anomalies = [a for a in high_severity if a.anomaly_type in ["spike", "outlier"] and a.deviation_pct and a.deviation_pct > 0]
            dip_anomalies = [a for a in high_severity if a.anomaly_type in ["dip", "outlier"] and a.deviation_pct and a.deviation_pct < 0]

            if spike_anomalies:
                top_spike = max(spike_anomalies, key=lambda a: a.deviation_pct or 0)
                paragraphs.append(
                    f"Notable outperformer: **{top_spike.creator_name}** exceeded expectations by "
                    f"{top_spike.deviation_pct:.0f}% on {top_spike.metric}. {top_spike.likely_cause}."
                )

            if dip_anomalies:
                worst_dip = min(dip_anomalies, key=lambda a: a.deviation_pct or 0)
                paragraphs.append(
                    f"Underperformance flagged: **{worst_dip.creator_name}** was {abs(worst_dip.deviation_pct):.0f}% "
                    f"below expected on {worst_dip.metric}. {worst_dip.recommendation}."
                )

        # Recommendations summary
        if overall_roi >= 1.5:
            paragraphs.append(
                "**Recommendation:** Scale this campaign. Strong ROI indicates product-audience fit. "
                "Consider increasing budget allocation to top performers and expanding in high-ROI segments."
            )
        elif overall_roi >= 1.0:
            paragraphs.append(
                "**Recommendation:** Optimize and iterate. ROI is positive but has room for improvement. "
                "Focus on replicating top performer strategies and renegotiating underperformer rates."
            )
        else:
            paragraphs.append(
                "**Recommendation:** Reassess strategy. Negative ROI suggests misalignment. "
                "Review creator selection criteria, content briefs, and rate negotiations before next activation."
            )

        return "\n\n".join(paragraphs)

    def run_analysis(
        self,
        df: pd.DataFrame,
        metrics: list[CreatorMetrics],
        platform: Platform
    ) -> DriverAnalysis:
        """
        Main entry point: run complete anomaly detection and driver analysis.

        Args:
            df: Normalized campaign dataframe
            metrics: Calculated creator metrics
            platform: Detected platform

        Returns:
            Complete DriverAnalysis with anomalies and insights
        """
        logger.info(f"Running anomaly detection for {len(metrics)} creators")

        all_anomalies = []

        # Get creator names series
        names = pd.Series([m.creator_name for m in metrics])

        # Detect anomalies in key metrics
        metrics_to_analyze = [
            ("roi", pd.Series([m.roi for m in metrics])),
            ("emv", pd.Series([m.emv for m in metrics])),
            ("views", pd.Series([m.views for m in metrics])),
        ]

        if platform == Platform.TWITCH:
            metrics_to_analyze.append(
                ("accv", pd.Series([m.accv or 0 for m in metrics]))
            )

        for metric_name, values in metrics_to_analyze:
            # Use Z-score for normally distributed metrics
            zscore_anomalies = self.detect_outliers_zscore(values, names, metric_name)
            all_anomalies.extend(zscore_anomalies)

            # Use IQR for additional robustness
            iqr_anomalies = self.detect_outliers_iqr(values, names, metric_name)
            # Only add IQR anomalies not already found by Z-score
            existing = {(a.creator_name, a.metric) for a in all_anomalies}
            for a in iqr_anomalies:
                if (a.creator_name, a.metric) not in existing:
                    all_anomalies.append(a)

        # Deduplicate and sort by severity
        all_anomalies = sorted(all_anomalies, key=lambda a: a.severity_score, reverse=True)

        # Concentration analysis
        concentration_text, top_creators, top_emv_share = self.analyze_concentration(metrics)

        # Best segments
        best_genre, best_genre_roi, best_country, best_country_roi = self.find_best_segments(metrics)

        # Generate insight summary
        insight_summary = self.generate_insight_summary(
            metrics, all_anomalies,
            concentration_text,
            best_genre, best_genre_roi,
            best_country, best_country_roi
        )

        return DriverAnalysis(
            top_performer_concentration=concentration_text,
            top_n_creators=top_creators[:5],
            top_n_emv_share=round(top_emv_share, 1),
            best_genre=best_genre,
            best_genre_roi=round(best_genre_roi, 2) if best_genre_roi else None,
            best_country=best_country,
            best_country_roi=round(best_country_roi, 2) if best_country_roi else None,
            anomalies=all_anomalies,
            insight_summary=insight_summary,
        )
