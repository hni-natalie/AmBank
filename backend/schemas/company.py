"""Company schema for sector agent output."""
from pydantic import BaseModel
from typing import Optional, List


class FinancialData(BaseModel):
    """Financial data for a single year."""
    financial_year: str  # e.g., "31 Dec, 2024"
    revenue: Optional[float] = None  # Revenue ('000)
    net: Optional[float] = None  # Net profit ('000)
    eps: Optional[float] = None  # Earnings per share
    dp_percent: Optional[float] = None  # Dividend Payout %
    net_percent: Optional[float] = None  # Net Margin %


class Company(BaseModel):
    """Company information from KLSE Screener."""
    name: str  # Stock name/ticker (e.g., "DYNAFNT")
    code: str  # Stock code/ticker
    detail_url: Optional[str] = None  # URL to company detail page (from name link)
    revenue: Optional[float] = None  # Revenue (in millions)
    eps: Optional[float] = None  # Earnings per share (column 9, index 8)
    pe_ratio: Optional[float] = None  # PE ratio (column 12, index 11)
    dividend_yield: Optional[float] = None  # Dividend yield % (column 13, index 12)
    roe: Optional[float] = None  # Return on Equity % (column 14, index 13)
    market_cap: Optional[float] = None  # Market capitalization (column 16, index 15)
    sector: str  # Sector name (from filter selection)
    average_volume: Optional[float] = None  # Average Volume (3M) from company detail page
    annual_report: Optional[List[str]] = None  # URLs to Integrated Annual Report
    watchlist: bool = False  # Whether the company is on the client's watchlist
    
    # Financial data from Annual page (latest year for backwards compatibility)
    annual_revenue: Optional[float] = None  # Revenue from Annual page ('000)
    annual_net: Optional[float] = None  # Net profit from Annual page ('000)
    annual_eps: Optional[float] = None  # EPS from Annual page
    annual_dp_percent: Optional[float] = None  # Dividend Payout % from Annual page
    annual_net_percent: Optional[float] = None  # Net Margin % from Annual page
    financial_year: Optional[str] = None  # Financial year (e.g., "31 Dec, 2024")
    
    # Multi-year financial data (up to 5 years)
    financial_history: Optional[List[FinancialData]] = None  # List of financial data for multiple years


class SectorCompanies(BaseModel):
    """Sector companies response."""
    sector: str
    companies: List[Company]
    total_count: int
