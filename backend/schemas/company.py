"""Company schema for sector agent output."""
from pydantic import BaseModel
from typing import Optional, List


class Company(BaseModel):
    """Company information from KLSE Screener."""
    name: str  # Stock name/ticker (e.g., "DYNAFNT")
    code: str  # Stock code/ticker
    detail_url: Optional[str] = None  # URL to company detail page (from name link)
    price: Optional[float] = None  # Current price (column 4, index 3)
    volume: Optional[float] = None  # Trading volume (column 8, index 7)
    eps: Optional[float] = None  # Earnings per share (column 9, index 8)
    pe_ratio: Optional[float] = None  # PE ratio (column 12, index 11)
    dividend_yield: Optional[float] = None  # Dividend yield % (column 13, index 12)
    roe: Optional[float] = None  # Return on Equity % (column 14, index 13)
    market_cap: Optional[float] = None  # Market capitalization (column 16, index 15)
    sector: str  # Sector name (from filter selection)


class SectorCompanies(BaseModel):
    """Sector companies response."""
    sector: str
    companies: List[Company]
    total_count: int
