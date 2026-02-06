"""
AFK Analytics Backend - Core Processing Modules
================================================

Production-grade analytics engines for campaign data processing.
"""

from .normalizer import SchemaNormalizer
from .benchmarking import BenchmarkingEngine
from .anomaly import AnomalyDetector

__all__ = ["SchemaNormalizer", "BenchmarkingEngine", "AnomalyDetector"]
