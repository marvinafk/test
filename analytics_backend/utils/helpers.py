"""
Utility Helper Functions
========================

Common utilities used across the analytics backend.
"""

from typing import Union


def format_currency(value: float, symbol: str = "$") -> str:
    """Format a number as currency with proper formatting."""
    if value >= 1_000_000:
        return f"{symbol}{value / 1_000_000:.2f}M"
    elif value >= 1_000:
        return f"{symbol}{value / 1_000:.2f}K"
    else:
        return f"{symbol}{value:.2f}"


def format_percentage(value: float, decimals: int = 1) -> str:
    """Format a number as percentage."""
    return f"{value:.{decimals}f}%"


def safe_divide(
    numerator: Union[int, float],
    denominator: Union[int, float],
    default: float = 0.0
) -> float:
    """Safely divide two numbers, returning default if denominator is zero."""
    if denominator == 0 or denominator is None:
        return default
    return numerator / denominator
