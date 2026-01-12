"""API routes for investment decision system."""
from fastapi import APIRouter, HTTPException
from schemas.preferences import Preferences
from schemas.decision import Decision
from schemas.company import SectorCompanies
from agents import get_macro_signal, clear_session_store, get_klse_sector_companies
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


@router.get("/sector/{sector}/companies", response_model=SectorCompanies)
async def get_sector_companies(sector: str) -> SectorCompanies:
    """
    Get all companies in a specific sector from KLSE Screener.
    
    Args:
        sector: Sector name (e.g., "technology", "finance", "healthcare", "energy", 
                "consumer", "industrial")
        
    Returns:
        SectorCompanies object with list of companies in the sector
        
    Example:
        GET /api/sector/technology/companies
        GET /api/sector/finance/companies
    """
    try:
        result = get_klse_sector_companies(sector)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching companies: {str(e)}"
        )

