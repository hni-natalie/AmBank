"""Macro signal schema for agent output."""
from pydantic import BaseModel


class MacroSignal(BaseModel):
    """Macro economic signal from agent."""
    macro_stance: str  # e.g., "risk_on", "risk_off", "neutral"
    confidence: float  # 0.0 to 1.0
    summary: str  # Brief description

