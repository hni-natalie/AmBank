"""Schema for company query analysis."""
from pydantic import BaseModel
from typing import Optional
from schemas.company import Company


class CompanyQueryRequest(BaseModel):
    """Request schema for company query."""
    query: str  # Natural language query (e.g., "can I buy AMBANK now")


class CompanyQueryResponse(BaseModel):
    """Response for company query analysis."""
    query: str  # Original user query
    extracted_company_name: str  # Company name extracted from query
    company: Company  # Company data from KLSE Screener
    analysis: str  # Analysis of the company
    recommendation: str  # Final recommendation: "suggested" or "not suggested"
    confidence: Optional[float] = None  # Confidence score (0-1)
    reasoning: Optional[str] = None  # Reasoning for the recommendation
