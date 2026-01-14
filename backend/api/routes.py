"""API routes for investment decision system."""
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
import requests
import os
import json
from typing import Optional, List, Dict
from schemas.preferences import Preferences
from schemas.decision import Decision
from schemas.company import SectorCompanies
from schemas.company_query import CompanyQueryRequest, CompanyQueryResponse
from agents_utils import get_macro_signal, clear_session_store, get_klse_sector_companies, analyze_company_query, _search_company_on_klse, get_companies_by_sector_name, get_annual_report_pdfs, download_and_search_pdf
from principles.principles_engine import evaluate_decision
from utils.logger import get_all_logs, clear_logs
import pdfplumber
import numpy as np
import aiohttp
import tempfile

router = APIRouter()


class PDFSearchRequest(BaseModel):
    """Request model for PDF search endpoint."""
    ar: List[str]  # Annual report URLs
    prompt: Optional[str] = None  # Optional custom prompt for Ollama to analyze


class PDFSearchResponse(BaseModel):
    """Response model for PDF search endpoint."""
    total_pdfs: int
    results: List[Dict]
    analysis: str  # Ollama analysis of the content


class FinancialMetrics(BaseModel):
    """Financial metrics extracted from annual reports."""
    revenue: Optional[str] = None
    gross_profit: Optional[str] = None
    gross_margin: Optional[str] = None
    ebitda: Optional[str] = None
    profit_before_tax: Optional[str] = None
    pbt_margin: Optional[str] = None
    net_income: Optional[str] = None


class ExtractFinancialsRequest(BaseModel):
    """Request model for extracting financial metrics from annual reports."""
    ar: List[str]  # Annual report URLs
    prompt: Optional[str] = None  # Optional custom prompt for analysis
    debug: Optional[bool] = False  # Enable debug mode to see extracted text and LLM response


class ExtractFinancialsResponse(BaseModel):
    """Response model for extracted financial metrics."""
    status: str
    total_pdfs: int
    processed: int
    results: List[Dict]


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


@router.post("/search-pdfs", response_model=PDFSearchResponse)
async def search_pdfs(request: PDFSearchRequest) -> PDFSearchResponse:
    """
    Analyze PDF annual reports using Ollama.
    
    This endpoint downloads PDFs from provided URLs, extracts all text content,
    and uses Ollama LLM to analyze the content based on your prompt.
    
    Args:
        request: PDFSearchRequest with ar (annual report URLs) and optional prompt
        
    Returns:
        PDFSearchResponse with analysis from Ollama
        
    Example:
        POST /api/search-pdfs
        {
            "ar": [
                "https://disclosure.bursamalaysia.com/FileAccess/apbursaweb/download?id=241384&name=EA_DS_ATTACHMENTS"
            ],
            "prompt": "Analyze the financial performance and key risks"
        }
    """
    try:
        if not request.ar:
            raise HTTPException(status_code=400, detail="ar list cannot be empty")
        
        # Import ollama
        try:
            import ollama
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="Ollama Python package not installed. Install with: pip install ollama"
            )
        
        # Download and extract text from PDFs
        results = []
        for pdf_url in request.ar:
            pdf_result = download_and_search_pdf(pdf_url, search_phrase="")
            results.append(pdf_result)
        
        # Combine all text from all PDFs
        all_text = ""
        for result in results:
            if result.get("matches"):
                for match in result["matches"]:
                    all_text += f"\n\nPage {match.get('page', 'N/A')}:\n{match.get('excerpt', '')}"
        
        # Use default prompt if none provided
        default_prompt = """Analyze this annual report content and provide:
1. Key financial highlights and metrics
2. Notable trends or changes year-over-year
3. Business risks and challenges mentioned
4. Opportunities and strategic initiatives
5. Overall assessment of company performance

Be concise and focus on the most important insights."""
        
        analysis_prompt = request.prompt if request.prompt else default_prompt
        full_prompt = f"{analysis_prompt}\n\nContent:\n{all_text[:15000]}"  # Limit to avoid token limits
        
        # Call Ollama for analysis
        try:
            response = ollama.chat(
                model="llama3.2",
                messages=[{"role": "user", "content": full_prompt}]
            )
            analysis = response.get("message", {}).get("content", "")
        except Exception as ollama_error:
            analysis = f"Ollama analysis failed: {str(ollama_error)}"
        
        return PDFSearchResponse(
            total_pdfs=len(request.ar),
            results=results,
            analysis=analysis
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing PDFs: {str(e)}"
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


@router.post("/annual-reports/extract-financials", response_model=ExtractFinancialsResponse)
async def extract_financials_from_annual_reports(request: ExtractFinancialsRequest):
    """
    Extract financial metrics from annual reports using Ollama LLM.
    
    This endpoint:
    1. Downloads PDFs from provided URLs
    2. Extracts all text content from the PDFs
    3. Uses Ollama to intelligently extract key financial metrics as structured JSON
    
    Request Body:
        {
            "ar": [
                "https://disclosure.bursamalaysia.com/FileAccess/apbursaweb/download?id=241384&name=EA_DS_ATTACHMENTS"
            ],
            "prompt": "Extract financial metrics focusing on profitability"  // optional
        }
    
    Returns:
        ExtractFinancialsResponse with extracted financial metrics for each PDF
        
    Extracted Metrics:
        - Revenue
        - Gross Profit
        - Gross Margin
        - EBITDA
        - Profit Before Tax (PBT)
        - PBT Margin
        - Net Income
        
    Example:
        POST /api/annual-reports/extract-financials
        Body: {"ar": ["https://example.com/report"]}
    """
    try:
        if not request.ar:
            raise HTTPException(status_code=400, detail="ar list cannot be empty")
        
        # Download and extract text from PDFs
        search_results = []
        for pdf_url in request.ar:
            pdf_result = download_and_search_pdf(pdf_url, search_phrase="")
            search_results.append(pdf_result)
        
        # Import ollama for LLM processing
        try:
            import ollama
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="Ollama Python package not installed. Install with: pip install ollama"
            )
        
        results = []
        processed_count = 0
        
        for pdf_result in search_results:
            matches = pdf_result.get("matches", [])
            
            if not matches:
                # No content extracted from this PDF
                results.append({
                    "status": "no_content_found",
                    "financial_metrics": None,
                    "message": "No content could be extracted from this PDF"
                })
                continue
            
            # Combine all text for context (limit to first 20 pages or so)
            highlights_text = "\n\n".join([
                f"Page {m.get('page', 'N/A')}:\n{m.get('excerpt', '')}"
                for m in matches[:20]  # Limit pages to avoid token limits
            ])
            
            if request.debug:
                print(f"\n{'='*80}")
                print(f"DEBUG: Processing PDF {len(results) + 1}")
                print(f"DEBUG: Extracted {len(matches)} pages")
                print(f"DEBUG: Text length: {len(highlights_text)} characters")
                print(f"DEBUG: First 500 chars of extracted text:")
                print(highlights_text[:500])
                print(f"{'='*80}\n")
            
            # 
            # Construct prompt for Ollama to extract comprehensive financial data
            prompt = f"""You are a financial data extraction system. Extract numbers from financial statements and return valid JSON.

DO NOT write explanations or narrative text. ONLY return a JSON object.

Extract these financial metrics from the annual report text:

PROFIT & LOSS (Income Statement):
- revenue: Total revenue/sales/turnover
- cogs: Cost of goods sold/cost of sales
- gross_profit: Gross profit
- ebitda: EBITDA/EBIT/operating profit
- net_profit: Net profit/profit after tax/profit attributable to owners
- interest_expense: Finance costs/interest expense

BALANCE SHEET:
- total_assets: Total assets
- total_equity: Total equity/shareholders' equity/equity attributable to owners
- receivables: Trade receivables/accounts receivable
- inventory: Inventories/stock
- payables: Trade payables/accounts payable
- cash: Cash and cash equivalents/bank balances
- short_term_debt: Current borrowings/short-term loans
- long_term_debt: Non-current borrowings/long-term loans
- retained_earnings: Retained earnings/accumulated profits

CASH FLOW:
- operating_cash_flow: Net cash from operating activities
- capex: Purchase of PPE/capital expenditure (as positive number)
- free_cash_flow: Free cash flow
- debt_repayment: Repayment of borrowings/loans (as positive number)

NUMBER FORMATTING RULES:
1. Remove ALL commas from numbers: "687,152" → 687152
2. Pay attention to units in column headers:
   - If header says "RM'000" or "RM ('000)" → multiply number by 1,000
   - If header says "RM'Million" or "RM (Million)" → multiply number by 1,000,000
   - If no unit specified → use number as-is
3. Examples:
   - "Revenue 687,152" under "RM'000" column → 687152 × 1000 = 687152000
   - "Revenue 430,451" under "RM'000" column → 430451 × 1000 = 430451000
   - "Assets 1,234.5" under "RM Million" column → 1234.5 × 1000000 = 1234500000
   - "Cash 50,000" with no unit → 50000
4. Use null if value not found

EXAMPLE OUTPUT:
{{
"revenue": 687152000,
"cogs": 430000000,
"gross_profit": 257152000,
"ebitda": 360300000,
"net_profit": 226900000,
"interest_expense": 15000000,
"total_assets": 1500000000,
"total_equity": 800000000,
"receivables": 120000000,
"inventory": 50000000,
"payables": 80000000,
"cash": 200000000,
"short_term_debt": 100000000,
"long_term_debt": 400000000,
"retained_earnings": 500000000,
"operating_cash_flow": 250000000,
"capex": 50000000,
"free_cash_flow": 200000000,
"debt_repayment": 30000000
}}

Now extract from this text (look for column headers to determine units):
{highlights_text[:8000]}
"""
            
            try:
                # Call Ollama to extract metrics with format specification
                try:
                    # Try with JSON format mode if supported
                    response = ollama.chat(
                        model="llama3.2",
                        messages=[
                            {
                                "role": "system", 
                                "content": "You are a JSON-only financial data extraction system. You must respond with valid JSON only, no other text."
                            },
                            {
                                "role": "user", 
                                "content": prompt
                            }
                        ],
                        format="json",  # Request JSON format
                        options={
                            "temperature": 0.1,  # Lower temperature for more deterministic output
                        }
                    )
                except Exception:
                    # Fallback without format parameter if not supported
                    response = ollama.chat(
                        model="llama3.2",
                        messages=[
                            {
                                "role": "system", 
                                "content": "You are a JSON-only financial data extraction system. You must respond with valid JSON only, no other text."
                            },
                            {
                                "role": "user",
                                "content": prompt
                            }
                        ],
                        options={
                            "temperature": 0.1,
                        }
                    )
                
                llm_response = response.get("message", {}).get("content", "")
                
                # Debug logging
                if request.debug:
                    print(f"\n{'='*80}")
                    print(f"DEBUG: LLM Raw Response:")
                    print(llm_response[:1000])
                    print(f"{'='*80}\n")
                
                # Try to parse JSON from response
                try:
                    # Clean the response - remove markdown code blocks if present
                    cleaned_response = llm_response.strip()
                    if cleaned_response.startswith("```json"):
                        cleaned_response = cleaned_response[7:]
                    if cleaned_response.startswith("```"):
                        cleaned_response = cleaned_response[3:]
                    if cleaned_response.endswith("```"):
                        cleaned_response = cleaned_response[:-3]
                    cleaned_response = cleaned_response.strip()
                    
                    # Try to find JSON object in the response
                    import re
                    # Look for JSON object with better pattern matching
                    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', cleaned_response, re.DOTALL)
                    if json_match:
                        financial_metrics = json.loads(json_match.group())
                    else:
                        # Try parsing the cleaned response directly
                        financial_metrics = json.loads(cleaned_response)
                    
                    # Validate that we got actual financial data (not just an error message)
                    if "raw_response" in financial_metrics or "parse_error" in financial_metrics:
                        # This is already an error object
                        pass
                    elif not any(key in financial_metrics for key in ["revenue", "net_profit", "total_assets", "ebitda"]):
                        # No financial metrics found - probably got narrative text
                        financial_metrics = {
                            "raw_response": llm_response[:1000],
                            "parse_error": "LLM returned text instead of JSON. Try using a different model or check if the PDF contains actual financial statements.",
                            "suggestion": "The extracted text may not contain structured financial data. Look for sections like 'Financial Highlights', 'Income Statement', or 'Balance Sheet'."
                        }
                        
                except json.JSONDecodeError as je:
                    financial_metrics = {
                        "raw_response": llm_response[:1000],
                        "parse_error": f"Could not parse JSON from LLM response: {str(je)}",
                        "suggestion": "The LLM may need to be instructed more strictly, or the PDF may not contain parseable financial statements."
                    }
                
                # Debug logging
                if request.debug:
                    print(f"\n{'='*80}")
                    print(f"DEBUG: Extracted Financial Metrics:")
                    import json as json_lib
                    print(json_lib.dumps(financial_metrics, indent=2))
                    print(f"{'='*80}\n")
                
                result_data = {
                    "status": "success",
                    "pages_with_highlights": [m.get("page") for m in matches],
                    "financial_metrics": financial_metrics,
                    "highlights_excerpt": highlights_text[:500] + "..." if len(highlights_text) > 500 else highlights_text
                }
                
                # Add debug info if requested
                if request.debug:
                    result_data["debug_info"] = {
                        "extracted_text_sample": highlights_text[:1000],
                        "llm_response": llm_response[:1000],
                        "total_pages_extracted": len(matches)
                    }
                
                results.append(result_data)
                processed_count += 1
                
            except Exception as ollama_error:
                results.append({
                    "status": "ollama_error",
                    "financial_metrics": None,
                    "error": str(ollama_error),
                    "highlights_found": True,
                    "pages_with_highlights": [m.get("page") for m in matches]
                })
        
        return ExtractFinancialsResponse(
            status="success",
            total_pdfs=len(request.ar),
            processed=processed_count,
            results=results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error extracting financials from annual reports: {str(e)}"
        )


@router.post("/annual-reports/analyze")
async def analyze_annual_report_content(
    ar: List[str],
    custom_prompt: Optional[str] = None
):
    """
    Analyze annual report content with a custom prompt using Ollama.
    
    This is a more flexible endpoint that allows custom analysis prompts.
    
    Request Body:
        {
            "ar": ["https://example.com/report.pdf"],
            "custom_prompt": "Summarize the key business risks mentioned in this report"
        }
    
    Returns:
        Analysis results from Ollama for each PDF
        
    Example:
        POST /api/annual-reports/analyze
        Body: {
            "ar": ["https://example.com/report.pdf"],
            "custom_prompt": "What are the main revenue drivers?"
        }
    """
    try:
        if not ar:
            raise HTTPException(status_code=400, detail="ar list cannot be empty")
        
        import ollama
        
        # Extract all content from PDFs (no search phrase)
        search_results = []
        for pdf_url in ar:
            pdf_result = download_and_search_pdf(pdf_url, search_phrase="")
            search_results.append(pdf_result)
        
        default_prompt = """
Analyze the following annual report content and provide:
1. Key financial highlights
2. Notable trends or changes
3. Any concerns or red flags
4. Overall assessment

Be concise and focus on the most important points.
"""
        
        analysis_prompt = custom_prompt if custom_prompt else default_prompt
        results = []
        
        for pdf_result in search_results:
            matches = pdf_result.get("matches", [])
            
            if not matches:
                results.append({
                    "status": "no_content_found",
                    "analysis": None
                })
                continue
            
            content_text = "\n\n".join([
                f"Page {m.get('page', 'N/A')}:\n{m.get('excerpt', '')}"
                for m in matches
            ])
            
            full_prompt = f"{analysis_prompt}\n\nContent:\n{content_text}"
            
            try:
                response = ollama.chat(
                    model="llama3.2",
                    messages=[{"role": "user", "content": full_prompt}]
                )
                
                analysis = response.get("message", {}).get("content", "")
                
                results.append({
                    "status": "success",
                    "analysis": analysis,
                    "pages_analyzed": [m.get("page") for m in matches]
                })
                
            except Exception as ollama_error:
                results.append({
                    "status": "error",
                    "error": str(ollama_error)
                })
        
        return {
            "status": "success",
            "total_pdfs": len(ar),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing annual reports: {str(e)}"
        )


@router.post("/annual-reports/risk-analysis")
async def analyze_financial_risk(request: ExtractFinancialsRequest):
    """
    Extract financials from annual reports and perform cross-statement risk analysis.
    
    This endpoint:
    1. Extracts comprehensive financial metrics from PDFs
    2. Converts them to FinancialSnapshot objects
    3. Performs cross-statement analysis to identify risks
    
    Request Body:
        {
            "ar": [
                "https://example.com/report_2024.pdf",
                "https://example.com/report_2023.pdf"  // optional: previous year for comparison
            ]
        }
    
    Returns:
        {
            "status": "success",
            "financial_data": {...},
            "risk_analysis": {
                "risk_level": "HIGH|MEDIUM|LOW",
                "metrics": {...},
                "risk_flags": [...]
            }
        }
        
    Example:
        POST /api/annual-reports/risk-analysis
        Body: {"ar": ["https://example.com/report.pdf"]}
    """
    try:
        if not request.ar:
            raise HTTPException(status_code=400, detail="ar list cannot be empty")
        
        # Import required modules
        from cross_statement_analysis import create_financial_snapshot_from_api, cross_statement_analysis
        
        # Extract financials using the existing endpoint logic
        extraction_response = await extract_financials_from_annual_reports(request)
        
        if not extraction_response.results:
            raise HTTPException(
                status_code=400,
                detail="No financial data could be extracted from the provided PDFs"
            )
        
        # Get the extracted financial metrics
        snapshots = []
        for idx, result in enumerate(extraction_response.results):
            if result.get("status") == "success" and result.get("financial_metrics"):
                snapshot = create_financial_snapshot_from_api(result["financial_metrics"])
                if snapshot:
                    snapshots.append({
                        "pdf_index": idx,
                        "snapshot": snapshot,
                        "raw_metrics": result["financial_metrics"]
                    })
        
        if not snapshots:
            raise HTTPException(
                status_code=400,
                detail="Could not create FinancialSnapshot from extracted data. Please ensure the PDFs contain complete financial statements."
            )
        
        # Perform cross-statement analysis
        # Use the first (most recent) as current, second as previous if available
        current_snapshot = snapshots[0]["snapshot"]
        previous_snapshot = snapshots[1]["snapshot"] if len(snapshots) > 1 else None
        
        risk_analysis = cross_statement_analysis(current_snapshot, previous_snapshot)
        
        return {
            "status": "success",
            "total_pdfs": len(request.ar),
            "snapshots_created": len(snapshots),
            "financial_data": {
                "current": snapshots[0]["raw_metrics"],
                "previous": snapshots[1]["raw_metrics"] if len(snapshots) > 1 else None
            },
            "risk_analysis": risk_analysis,
            "interpretation": {
                "risk_level": risk_analysis["risk_level"],
                "total_flags": len(risk_analysis["risk_flags"]),
                "high_severity_flags": len([f for f in risk_analysis["risk_flags"] if f["severity"] == "high"]),
                "categories_affected": list(set(f["category"] for f in risk_analysis["risk_flags"]))
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing risk analysis: {str(e)}"
        )
