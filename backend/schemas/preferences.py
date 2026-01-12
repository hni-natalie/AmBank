"""Preferences schema for investment decision input."""
from pydantic import BaseModel
from typing import List


class Preferences(BaseModel):
    """User investment preferences."""
    time_horizon: str  # e.g., "short", "medium", "long"
    risk_level: str  # e.g., "conservative", "balanced", "aggressive"
    sectors: List[str]  # e.g., ["technology", "finance"]

