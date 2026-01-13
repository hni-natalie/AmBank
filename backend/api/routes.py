"""API routes for investment decision system."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from schemas.preferences import Preferences
from schemas.decision import Decision
from schemas.company import SectorCompanies
from schemas.company_query import CompanyQueryRequest, CompanyQueryResponse
from agents import get_macro_signal, clear_session_store, get_klse_sector_companies, analyze_company_query, _search_company_on_klse, get_companies_by_sector_name, get_annual_report_pdfs
from principles.principles_engine import evaluate_decision
from utils.logger import get_all_logs, clear_logs

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


@router.get("/logs")
async def get_logs(
    agent_name: Optional[str] = Query(None, description="Filter by agent name"),
    level: Optional[str] = Query(None, description="Filter by log level (INFO, DEBUG, WARNING, ERROR, CRITICAL)"),
    limit: Optional[int] = Query(None, description="Limit number of logs returned (most recent first)")
):
    """
    Get all logging messages from agents.
    
    Args:
        agent_name: Optional filter by agent name (e.g., "klse_sector_agent", "volume_filter_agent")
        level: Optional filter by log level
        limit: Optional limit on number of logs to return
        
    Returns:
        List of log entries with timestamps, agent info, and messages
        
    Example:
        GET /api/logs
        GET /api/logs?agent_name=klse_sector_agent
        GET /api/logs?level=ERROR
        GET /api/logs?limit=100
        GET /api/logs?agent_name=volume_filter_agent&level=INFO&limit=50
    """
    try:
        logs = get_all_logs(agent_name=agent_name, level=level, limit=limit)
        return {
            "status": "success",
            "total_logs": len(logs),
            "filters": {
                "agent_name": agent_name,
                "level": level,
                "limit": limit
            },
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving logs: {str(e)}"
        )


@router.delete("/logs")
async def clear_logs_endpoint():
    """
    Clear all stored logging messages.
    
    Returns:
        Confirmation message
    """
    try:
        clear_logs()
        return {
            "status": "success",
            "message": "All logs cleared"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing logs: {str(e)}"
        )


@router.get("/ollama/test")
async def test_ollama():
    """
    Test Ollama connection and availability.
    
    Returns:
        Status of Ollama connection and available models
        
    Example:
        GET /api/ollama/test
    """
    try:
        # Test if ollama package is available
        try:
            import ollama
        except ImportError:
            return {
                "status": "error",
                "message": "Ollama Python package not installed",
                "package_installed": False,
                "ollama_running": False,
                "suggestion": "Install with: pip install ollama"
            }
        
        # Test connection to Ollama server
        try:
            # Try to list models (simple API call)
            models = ollama.list()
            available_models = [model.get('name', 'unknown') for model in models.get('models', [])]
            
            # Try a simple chat request
            test_response = ollama.chat(
                model="llama3.2" if "llama3.2" in available_models else available_models[0] if available_models else "llama3.2",
                messages=[{"role": "user", "content": "Say 'OK' if you can hear me."}]
            )
            
            return {
                "status": "success",
                "message": "Ollama is running and accessible",
                "package_installed": True,
                "ollama_running": True,
                "available_models": available_models,
                "test_response": test_response.get('message', {}).get('content', '')[:100] if test_response else None
            }
        except ConnectionRefusedError:
            return {
                "status": "error",
                "message": "Cannot connect to Ollama server",
                "package_installed": True,
                "ollama_running": False,
                "suggestion": "Make sure Ollama is running. Start it with: ollama serve (or just run 'ollama' in terminal)"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Ollama connection error: {str(e)}",
                "package_installed": True,
                "ollama_running": False,
                "error_type": type(e).__name__,
                "suggestion": "Check if Ollama server is running and accessible"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Unexpected error: {str(e)}",
            "package_installed": False,
            "ollama_running": False
        }


@router.post("/company/query", response_model=CompanyQueryResponse)
async def query_company(request: CompanyQueryRequest):
    """
    Analyze a company query using LLM and vector search.
    
    This endpoint takes a natural language query about a company, extracts the company name,
    searches for it on KLSE Screener, performs vector search on the company's detail page,
    and uses Ollama LLM to provide a buy/sell/hold recommendation.
    
    Request Body:
        {
            "query": "can I buy AMBANK now"
        }
    
    Returns:
        CompanyQueryResponse with company data, analysis, and recommendation
        
    Example:
        POST /api/company/query
        Body: {"query": "can I buy AMBANK now"}
    """
    try:
        result = analyze_company_query(request.query)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing company query: {str(e)}"
        )


@router.get("/company/search")
async def search_company(company_name: str = Query(..., description="Company name or ticker to search for")):
    """
    Search for a company on KLSE Screener by name or ticker.
    
    This endpoint directly searches for a company using the KLSE Screener website
    and returns the company's basic information and financial data.
    
    Query Parameters:
        company_name: Name or ticker of the company (e.g., "AMBANK", "Sunway", "MAYBANK")
    
    Returns:
        Company data including name, code, price, financial metrics, and detail URL
        
    Example:
        GET /api/company/search?company_name=AMBANK
        GET /api/company/search?company_name=Sunway
    """
    try:
        if not company_name or company_name.strip() == "":
            raise HTTPException(status_code=400, detail="company_name parameter is required")
        
        result = _search_company_on_klse(company_name.strip())
        
        if result is None:
            raise HTTPException(
                status_code=404, 
                detail=f"Company '{company_name}' not found on KLSE Screener"
            )
        
        return {
            "status": "success",
            "company": result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching for company: {str(e)}"
        )

@router.get("/company/sector-peers")
async def get_company_sector_peers(company_name: str = Query(..., description="Company name to find sector peers for")):
    """
    Find all companies in the same sector/subsector as the specified company.
    
    This endpoint:
    1. Searches for the specified company on KLSE Screener
    2. Extracts the company's sector from its detail page
    3. Finds all companies in that same sector/subsector
    4. Returns the complete list of sector peers
    
    Query Parameters:
        company_name: Name or ticker of the company (e.g., "GAMUDA", "Sunway", "AMBANK")
    
    Returns:
        The searched company's data and all companies in the same sector
        
    Example:
        GET /api/company/sector-peers?company_name=ambank
        GET /api/company/sector-peers?company_name=Sunway
    """
    try:
        if not company_name or company_name.strip() == "":
            raise HTTPException(status_code=400, detail="company_name parameter is required")
        
        # Step 1: Search for the company and get its sector
        print(f"[SECTOR_PEERS] Step 1: Searching for company '{company_name}'...")
        company_data = _search_company_on_klse(company_name.strip())
        
        if company_data is None:
            raise HTTPException(
                status_code=404, 
                detail=f"Company '{company_name}' not found on KLSE Screener"
            )
        
        sector = company_data.get("sector", "unknown")
        if not sector or sector == "unknown":
            raise HTTPException(
                status_code=404,
                detail=f"Could not determine sector for company '{company_name}'"
            )
        
        print(f"[SECTOR_PEERS] Step 2: Found company in sector '{sector}', searching for all companies in this sector...")
        
        # Step 2: Get all companies in that sector
        companies = get_companies_by_sector_name(sector)
        
        if not companies:
            raise HTTPException(
                status_code=404, 
                detail=f"No companies found for sector '{sector}' on KLSE Screener"
            )
        
        print(f"[SECTOR_PEERS] Step 3: Found {len(companies)} companies in sector '{sector}'")
        
        return {
            "status": "success",
            "searched_company": {
                "name": company_data.get("name", company_name),
                "code": company_data.get("code", ""),
                "sector": sector,
                "pe_ratio": company_data.get("pe_ratio"),
                "dividend_yield": company_data.get("dividend_yield"),
                "roe": company_data.get("roe"),
                "market_cap": company_data.get("market_cap"),
                "detail_url": company_data.get("detail_url")
            },
            "sector": sector,
            "total_peers": len(companies),
            "companies": [company.dict() for company in companies]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sector peers: {str(e)}"
        )


@router.get("/sector/companies")
async def get_companies_by_sector(sector_name: str = Query(..., description="Sector name to search for")):
    """
    Get all companies in a specific sector by searching KLSE Screener's sector/subsector dropdowns.
    
    This endpoint takes a sector name (e.g., from a Company object's sector field),
    finds it in the sector or subsector dropdown on KLSE Screener, clicks Screen,
    and returns all companies in that sector.
    
    Query Parameters:
        sector_name: Sector name (e.g., "Diversified Industrials", "Financial Services", "Technology")
    
    Returns:
        List of companies in the sector with their financial data
        
    Example:
        GET /api/sector/companies?sector_name=Financial Services
        GET /api/sector/companies?sector_name=Diversified Industrials
        GET /api/sector/companies?sector_name=Technology
    """
    try:
        if not sector_name or sector_name.strip() == "":
            raise HTTPException(status_code=400, detail="sector_name parameter is required")
        
        companies = get_companies_by_sector_name(sector_name.strip())
        
        if not companies:
            raise HTTPException(
                status_code=404, 
                detail=f"No companies found for sector '{sector_name}' on KLSE Screener. The sector may not exist or may be empty."
            )
        
        return {
            "status": "success",
            "sector": sector_name,
            "total_count": len(companies),
            "companies": [company.dict() for company in companies]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching companies by sector: {str(e)}"
        )


@router.get("/company/{company_code}/annual-reports")
async def get_company_annual_reports(company_code: str):
    """
    Get all annual report PDF links for a company.
    
    This endpoint:
    1. Navigates to the company's detail page on KLSE Screener
    2. Clicks on the "Annual" link
    3. Clicks on the first "View" link
    4. Extracts all PDF file URLs from that page
    
    Path Parameters:
        company_code: Company code (e.g., "5211", "1295", "5398")
    
    Returns:
        List of PDF URLs for annual reports
        
    Example:
        GET /api/company/5211/annual-reports
        GET /api/company/1295/annual-reports
    """
    try:
        if not company_code or company_code.strip() == "":
            raise HTTPException(status_code=400, detail="company_code is required")
        
        pdf_urls = get_annual_report_pdfs(company_code.strip())
        
        if not pdf_urls:
            return {
                "status": "success",
                "company_code": company_code,
                "total_pdfs": 0,
                "pdf_urls": [],
                "message": "No PDF files found. The company may not have annual reports available or the page structure may have changed."
            }
        
        return {
            "status": "success",
            "company_code": company_code,
            "total_pdfs": len(pdf_urls),
            "pdf_urls": pdf_urls
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching annual reports: {str(e)}"
        )