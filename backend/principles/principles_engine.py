"""Principles engine - converts signals to decisions."""
from schemas.signals import MacroSignal
from schemas.decision import Decision


def evaluate_decision(signal: MacroSignal, preferences: dict) -> Decision:
    """
    Convert macro signal to investment decision based on principles.
    
    Args:
        signal: Macro signal from agent
        preferences: User preferences dict
        
    Returns:
        Decision with reasoning
    """
    # Stub implementation - returns hardcoded decision
    return Decision(
        decision="hold",
        confidence=0.68,
        reasoning=[
            "Macro environment supports moderate risk",
            "Principles favor capital preservation"
        ]
    )

