"""API routes for investment decision system."""
from fastapi import APIRouter
from schemas.preferences import Preferences
from schemas.decision import Decision
from agents import get_macro_signal, clear_session_store
from principles.principles_engine import evaluate_decision

router = APIRouter()


@router.post("/decision", response_model=Decision)
async def get_decision(preferences: Preferences) -> Decision:
    """
    Main endpoint: process preferences and return decision.
    
    Flow:
    1. Receive preferences
    2. Call macro agent
    3. Pass signal to principles engine
    4. Return decision JSON
    """
    # Clear previous session data
    clear_session_store()
    
    # Step 1: Get macro signal
    signal = get_macro_signal(preferences.dict())
    
    # Step 2: Evaluate decision
    decision = evaluate_decision(signal, preferences.dict())
    
    return decision


@router.post("/session/clear")
async def clear_session():
    """Clear session data (vectors, temporary data)."""
    clear_session_store()
    return {"status": "cleared"}

