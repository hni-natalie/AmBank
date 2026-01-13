"""Principles engine - converts signals to decisions."""
from schemas.signals import MacroSignal
from schemas.decision import Decision
from utils.logger import AgentLogger, log_agent_execution


@log_agent_execution("principles_engine")
def evaluate_decision(signal: MacroSignal, preferences: dict) -> Decision:
    """
    Convert macro signal to investment decision based on principles.
    
    Args:
        signal: Macro signal from agent
        preferences: User preferences dict
        
    Returns:
        Decision with reasoning
    """
    logger = AgentLogger("principles_engine")
    logger.info(
        "Evaluating investment decision",
        input_data={"signal": signal.dict(), "preferences": preferences}
    )
    
    # Stub implementation - returns hardcoded decision
    result = Decision(
        decision="hold",
        confidence=0.68,
        reasoning=[
            "Macro environment supports moderate risk",
            "Principles favor capital preservation"
        ]
    )
    
    logger.info(
        "Decision evaluated",
        input_data={"signal": signal.dict(), "preferences": preferences},
        output_data=result.dict()
    )
    
    return result

