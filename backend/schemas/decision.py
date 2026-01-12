"""Decision schema for principles engine output."""
from pydantic import BaseModel
from typing import List


class Decision(BaseModel):
    """Final investment decision."""
    decision: str  # e.g., "buy", "sell", "hold"
    confidence: float  # 0.0 to 1.0
    reasoning: List[str]  # List of reasoning points

