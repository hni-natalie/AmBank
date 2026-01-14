"""Company identification API routes."""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from agents.company_identifier import CompanyIdentifier
from typing import Optional

company_router = APIRouter()

# Global company identifier instance
_company_identifier: Optional[CompanyIdentifier] = None


def get_company_identifier() -> CompanyIdentifier:
    """Get or create company identifier instance."""
    global _company_identifier
    if _company_identifier is None:
        _company_identifier = CompanyIdentifier()
    return _company_identifier


class UserInputRequest(BaseModel):
    """Request to identify company from user input."""
    user_input: str


@company_router.post("/company/identify")
async def identify_company(request: UserInputRequest):
    """
    Identify Malaysian company from user input and return structured JSON.
    
    Returns JSON in format:
    {
        "company_name": "Ambank",
        "ticker": "AMBANK.KL",
        "sector": "Banking",
        "peers": ["Maybank", "CIMB", "Public Bank"]
    }
    
    Or if not found:
    {
        "company_name": null,
        "ticker": null,
        "sector": null,
        "peers": []
    }
    """
    try:
        identifier = get_company_identifier()
        result = identifier.identify_company(request.user_input)
        
        # Ensure all fields are present
        return {
            "company_name": result.get("company_name"),
            "ticker": result.get("ticker"),
            "sector": result.get("sector"),
            "peers": result.get("peers", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error identifying company: {str(e)}")

# @company_router.get("/company/search")  # Use company_router here!
async def search_company(company_name: str = Query(...)):
    print(f"DEBUG: Received search for {company_name}")
    try:
        identifier = get_company_identifier()
        # Note: Ensure identify_company handles a single string correctly
        result = identifier.identify_company(company_name)
        return {
            "company_name": result.get("company_name"),
            "ticker": result.get("ticker"),
            "sector": result.get("sector"),
            "peers": result.get("peers", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching company: {str(e)}")