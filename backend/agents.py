"""Agents module - combines macro/sector/Bursa agents + in-memory vector store."""
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
import time
import logging
import re
import json
from datetime import datetime
from schemas.signals import MacroSignal
from schemas.company import Company, SectorCompanies
from schemas.company_query import CompanyQueryResponse
from utils.logger import AgentLogger, log_agent_execution

# Try to import ollama, fallback if not available
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    print("Warning: ollama package not available. Install with: pip install ollama")

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    print("Warning: numpy package not available. Install with: pip install numpy")

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Keep standard logger for backward compatibility
logger = logging.getLogger(__name__)


# ============================================================================
# In-Memory Vector Store (Session Only)
# ============================================================================

class SessionVectorStore:
    """In-memory vector store that clears on session end."""
    
    def __init__(self):
        """Initialize empty vector store."""
        self.vectors: List[Dict] = []
        self.metadata: Dict[str, any] = {}
    
    def add_vector(self, vector: List[float], metadata: Dict) -> str:
        """
        Add a vector to the store.
        
        Args:
            vector: Embedding vector
            metadata: Associated metadata
            
        Returns:
            Vector ID
        """
        vector_id = f"vec_{len(self.vectors)}"
        self.vectors.append({
            "id": vector_id,
            "vector": vector,
            "metadata": metadata
        })
        return vector_id
    
    def search(self, query_vector: List[float], top_k: int = 5) -> List[Dict]:
        """
        Search for similar vectors (stub - returns empty).
        
        Args:
            query_vector: Query embedding
            top_k: Number of results
            
        Returns:
            List of similar vectors
        """
        # Stub implementation - no actual similarity search
        return []
    
    def clear(self):
        """Clear all vectors and metadata (called on session end)."""
        self.vectors = []
        self.metadata = {}


# Global session store (cleared per session)
_session_store: Optional[SessionVectorStore] = None


def get_session_store() -> SessionVectorStore:
    """Get or create session vector store."""
    global _session_store
    if _session_store is None:
        _session_store = SessionVectorStore()
    return _session_store


def clear_session_store():
    """Clear session vector store."""
    global _session_store
    if _session_store is not None:
        _session_store.clear()
        _session_store = None


# ============================================================================
# Agents
# ============================================================================

@log_agent_execution("macro_agent")
def get_macro_signal(preferences: dict) -> MacroSignal:
    """
    Generate mocked macro signal based on preferences.
    
    Args:
        preferences: User preferences dict
        
    Returns:
        MacroSignal with mocked data
    """
    logger = AgentLogger("macro_agent")
    logger.info("Generating macro signal", input_data=preferences)
    
    # Stub implementation - returns hardcoded signal
    result = MacroSignal(
        macro_stance="risk_on",
        confidence=0.72,
        summary="Inflation easing with stable growth."
    )
    
    logger.info("Macro signal generated", input_data=preferences, output_data=result.dict())
    return result


@log_agent_execution("sector_agent")
def get_sector_signal(preferences: dict) -> dict:
    """
    Generate mocked sector signal (stub).
    
    Args:
        preferences: User preferences dict
        
    Returns:
        Sector signal dict
    """
    logger = AgentLogger("sector_agent")
    logger.info("Generating sector signal", input_data=preferences)
    
    # Stub implementation
    result = {
        "sector_stance": "neutral",
        "confidence": 0.65,
        "summary": "Sector analysis pending."
    }
    
    logger.info("Sector signal generated", input_data=preferences, output_data=result)
    return result


@log_agent_execution("bursa_agent")
def get_bursa_signal(preferences: dict) -> dict:
    """
    Generate mocked Bursa signal (stub).
    
    Args:
        preferences: User preferences dict
        
    Returns:
        Bursa signal dict
    """
    logger = AgentLogger("bursa_agent")
    logger.info("Generating Bursa signal", input_data=preferences)
    
    # Stub implementation
    result = {
        "bursa_stance": "neutral",
        "confidence": 0.60,
        "summary": "Bursa analysis pending."
    }
    
    logger.info("Bursa signal generated", input_data=preferences, output_data=result)
    return result


# ============================================================================
# KLSE Screener Sector Agent
# ============================================================================

# Mapping from user-friendly sector names to KLSE Screener sector names
SECTOR_MAPPING = {
    "technology": "Technology",
    "finance": "Financial Services",
    "healthcare": "Health Care",
    "energy": "Energy",
    "consumer": "Consumer Products & Services",
    "industrial": "Industrial Products & Services",
    "construction": "Construction",
    "property": "Property",
    "plantation": "Plantation",
    "telecommunications": "Telecommunications & Media",
    "transportation": "Transportation & Logistics",
    "utilities": "Utilities",
    "reit": "Real Estate Investment Trusts"
}

@log_agent_execution("fetch_volume_agent")
def fetch_average_volume_for_companies(companies: List[Company]) -> List[Company]:
    """
    Fetch Average Volume (3M) from company detail pages.
    
    This agent accesses each company's detail_url and extracts the "Average Volume (3M)" 
    value, populating the average_volume field for each company.
    
    Args:
        companies: List of Company objects to fetch volume for
        
    Returns:
        List of Company objects with average_volume field populated
    """
    agent_logger = AgentLogger("fetch_volume_agent")
    agent_logger.log_agent_start({"total_companies": len(companies)})
    
    print(f"[FETCH_VOLUME] Starting volume extraction for {len(companies)} companies")
    
    skipped_no_url = 0
    errors = 0
    success_count = 0
    
    for idx, company in enumerate(companies, 1):
        try:
            # Skip if no detail_url
            if not company.detail_url:
                print(f"  [FETCH_VOLUME.{idx}] Skipping {company.name} ({company.code}): No detail_url")
                company.average_volume = None
                skipped_no_url += 1
                continue
            
            print(f"  [FETCH_VOLUME.{idx}] Fetching detail page for {company.name} ({company.code})...")
            print(f"    URL: {company.detail_url}")
            
            # Fetch the detail page
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(company.detail_url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"    ⚠ Failed to fetch page: HTTP {response.status_code}")
                errors += 1
                company.average_volume = None
                continue
            
            # Parse the HTML
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Extract "Average Volume (3M)" value
            # Look for text containing "Average Volume" or "Average Volume (3M)"
            average_volume = None
            page_text = soup.get_text()
            
            # Try multiple strategies to find the value
            # Strategy 1: Look for "Average Volume (3M)" followed by a number
            # More specific patterns that avoid matching random zeros
            patterns = [
                r"Average Volume\s*\(3M\)\s*[:\-]?\s*([\d,]+(?:\.\d+)?)",
                r"Average Volume\s*\(3M\)[^\d]*([\d,]+(?:\.\d+)?)",
                r"Average Volume\s*\(3M\)[^0-9]*([1-9][\d,]*(?:\.[\d]+)?)",  # Must start with non-zero digit
            ]
            
            for pattern in patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    volume_str = match.group(1).replace(',', '').strip()
                    try:
                        volume_value = float(volume_str)
                        # Only accept if it's a meaningful value (not just 0 from noise)
                        if volume_value > 0 or (volume_value == 0 and "0" in match.group(0) and "Average Volume" in match.group(0)):
                            average_volume = volume_value
                            print(f"    ✓ Found Average Volume (3M): {average_volume:,.0f} (pattern: {pattern[:50]}...)")
                            break
                    except ValueError:
                        continue
            
            # Strategy 2: Look in tables for "Average Volume" row
            if average_volume is None:
                try:
                    tables = soup.find_all("table")
                    for table in tables:
                        rows = table.find_all("tr")
                        for row in rows:
                            cells = row.find_all(["td", "th"])
                            if len(cells) >= 2:
                                cell_text = cells[0].get_text(strip=True)
                                if "average volume" in cell_text.lower() and "3m" in cell_text.lower():
                                    value_cell = cells[1].get_text(strip=True)
                                    # Extract number from value cell - look for meaningful numbers
                                    # Try to find numbers with commas (formatted numbers) or large numbers
                                    volume_match = re.search(r"([\d,]+(?:\.\d+)?)", value_cell.replace(',', ''))
                                    if volume_match:
                                        try:
                                            volume_value = float(volume_match.group(1).replace(',', ''))
                                            average_volume = volume_value
                                            print(f"    ✓ Found Average Volume (3M) in table: {average_volume:,.0f}")
                                            print(f"      Table cell text: '{cell_text}' -> '{value_cell}'")
                                            break
                                        except ValueError:
                                            continue
                        if average_volume is not None:
                            break
                except Exception as e:
                    print(f"    ⚠ Error searching tables: {str(e)}")
            
            # Strategy 3: Look for specific div/span elements with volume data
            if average_volume is None:
                try:
                    # Look for elements containing "Average Volume" and "3M"
                    volume_elements = soup.find_all(string=re.compile(r"Average Volume.*3M|3M.*Average Volume", re.IGNORECASE))
                    for elem in volume_elements:
                        parent = elem.parent
                        if parent:
                            # Look for numbers nearby - get more context
                            nearby_text = parent.get_text()
                            # Look for number after "Average Volume (3M)" pattern
                            volume_match = re.search(r"Average Volume\s*\(3M\)[^\d]*([\d,]+(?:\.\d+)?)", nearby_text, re.IGNORECASE)
                            if volume_match:
                                try:
                                    volume_value = float(volume_match.group(1).replace(',', ''))
                                    average_volume = volume_value
                                    print(f"    ✓ Found Average Volume (3M) in element: {average_volume:,.0f}")
                                    print(f"      Element text: '{nearby_text[:100]}...'")
                                    break
                                except ValueError:
                                    continue
                except Exception as e:
                    print(f"    ⚠ Error searching elements: {str(e)}")
            
            # Debug: If still not found, log a sample of the page text
            if average_volume is None:
                # Look for any mention of "Average Volume" in the page
                avg_vol_mentions = re.findall(r"Average Volume[^\n]{0,100}", page_text, re.IGNORECASE)
                if avg_vol_mentions:
                    print(f"    ⚠ Found 'Average Volume' mentions but couldn't extract value:")
                    for mention in avg_vol_mentions[:3]:  # Show first 3 mentions
                        print(f"      - '{mention.strip()}'")
                print(f"    ⚠ Could not find Average Volume (3M)")
            else:
                success_count += 1
            
            # Update company with average_volume value
            company.average_volume = average_volume
            
            # Small delay to avoid overwhelming the server
            time.sleep(0.3)
            
        except requests.exceptions.RequestException as e:
            print(f"  [FETCH_VOLUME.{idx}] ⚠ Request error for {company.name}: {str(e)}")
            errors += 1
            company.average_volume = None
        except Exception as e:
            print(f"  [FETCH_VOLUME.{idx}] ⚠ Error processing {company.name}: {str(e)}")
            errors += 1
            company.average_volume = None
    
    print(f"[FETCH_VOLUME] ✓ Volume extraction complete:")
    print(f"  - Total companies: {len(companies)}")
    print(f"  - Successfully fetched: {success_count}")
    print(f"  - Skipped (no URL): {skipped_no_url}")
    print(f"  - Errors: {errors}")
    
    agent_logger.log_agent_end(
        input_data={"total_companies": len(companies)},
        output_data={
            "total_companies": len(companies),
            "success_count": success_count,
            "skipped_no_url": skipped_no_url,
            "errors": errors
        }
    )
    
    return companies


@log_agent_execution("fetch_annual_reports_agent")
def fetch_annual_reports_for_companies(companies: List[Company]) -> List[Company]:
    """
    Fetch annual report PDFs for a list of companies.
    
    This agent takes a list of Company objects, extracts their company codes,
    and fetches the annual report PDFs for each company.
    
    Args:
        companies: List of Company objects
        
    Returns:
        List of Company objects with annual_report_pdfs field populated
    """
    agent_logger = AgentLogger("fetch_annual_reports_agent")
    agent_logger.log_agent_start({"total_companies": len(companies)})
    
    print(f"[FETCH_ANNUAL_REPORTS] Starting annual report extraction for {len(companies)} companies")
    
    skipped_no_code = 0
    errors = 0
    success_count = 0
    
    for idx, company in enumerate(companies, 1):
        try:
            # Skip if no company code
            if not company.code:
                print(f"  [FETCH_ANNUAL_REPORTS.{idx}] Skipping {company.name}: No company code")
                company.annual_report_pdfs = []
                skipped_no_code += 1
                continue
            
            print(f"  [FETCH_ANNUAL_REPORTS.{idx}] Fetching annual reports for {company.name} ({company.code})...")
            
            # Fetch annual report PDFs
            pdf_urls = get_annual_report_pdfs(company.code)
            
            if pdf_urls:
                company.annual_report_pdfs = pdf_urls
                print(f"    ✓ Found {len(pdf_urls)} annual report PDF(s)")
                success_count += 1
            else:
                company.annual_report_pdfs = []
                print(f"    ⚠ No annual report PDFs found")
            
        except Exception as e:
            print(f"  [FETCH_ANNUAL_REPORTS.{idx}] ⚠ Error processing {company.name}: {str(e)}")
            errors += 1
            company.annual_report_pdfs = []
    
    print(f"[FETCH_ANNUAL_REPORTS] ✓ Annual report extraction complete:")
    print(f"  - Total companies: {len(companies)}")
    print(f"  - Successfully fetched: {success_count}")
    print(f"  - Skipped (no code): {skipped_no_code}")
    print(f"  - Errors: {errors}")
    
    agent_logger.log_agent_end(
        input_data={"total_companies": len(companies)},
        output_data={
            "total_companies": len(companies),
            "success_count": success_count,
            "skipped_no_code": skipped_no_code,
            "errors": errors
        }
    )
    
    return companies


@log_agent_execution("rsi_stochastic_agent")
def analyze_companies_rsi_stochastic(companies: List[Company]) -> List[Company]:
    """
    Analyze companies based on RSI(14) and Stochastic(14) indicators.
    
    This agent accesses each company's detail_url, extracts RSI(14) and Stochastic(14) 
    values, and determines trading action based on:
    - RSI <= 35 AND Stochastic <= 25 → Buy
    - RSI >= 70 AND Stochastic >= 75 → Sell
    - Otherwise → Hold
    
    Args:
        companies: List of Company objects to analyze
        
    Returns:
        List of Company objects with RSI, Stochastic, and action fields populated
    """
    agent_logger = AgentLogger("rsi_stochastic_agent")
    agent_logger.log_agent_start({"total_companies": len(companies)})
    
    print(f"[RSI_STOCHASTIC] Starting RSI/Stochastic analysis for {len(companies)} companies")
    
    analyzed_companies = []
    errors = 0
    
    for idx, company in enumerate(companies, 1):
        try:
            # Skip if no detail_url
            if not company.detail_url:
                print(f"  [RSI_STOCHASTIC.{idx}] Skipping {company.name} ({company.code}): No detail_url")
                company.action = "hold"  # Default to hold if no URL
                analyzed_companies.append(company)
                continue
            
            print(f"  [RSI_STOCHASTIC.{idx}] Analyzing {company.name} ({company.code})...")
            print(f"    URL: {company.detail_url}")
            
            # Fetch the detail page
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(company.detail_url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"    ⚠ Failed to fetch page: HTTP {response.status_code}")
                errors += 1
                company.rsi = None
                company.stochastic = None
                company.action = "hold"  # Default to hold on error
                analyzed_companies.append(company)
                continue
            
            # Parse the HTML
            soup = BeautifulSoup(response.content, 'lxml')
            page_text = soup.get_text()
            
            # Extract RSI(14) value
            rsi = None
            rsi_patterns = [
                r"RSI\(14\)[^\d]*([\d]+\.?\d*)",
                r"RSI\s*\(14\)[^\d]*([\d]+\.?\d*)",
                r"RSI\(14\)[:\-]?\s*([\d]+\.?\d*)",
                r"RSI\s*14[^\d]*([\d]+\.?\d*)",
            ]
            
            for pattern in rsi_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    try:
                        rsi = float(match.group(1))
                        print(f"    ✓ Found RSI(14): {rsi}")
                        break
                    except ValueError:
                        continue
            
            # Extract Stochastic(14) value
            stochastic = None
            stochastic_patterns = [
                r"Stochastic\(14\)[^\d]*([\d]+\.?\d*)",
                r"Stochastic\s*\(14\)[^\d]*([\d]+\.?\d*)",
                r"Stochastic\(14\)[:\-]?\s*([\d]+\.?\d*)",
                r"Stochastic\s*14[^\d]*([\d]+\.?\d*)",
            ]
            
            for pattern in stochastic_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    try:
                        stochastic = float(match.group(1))
                        print(f"    ✓ Found Stochastic(14): {stochastic}")
                        break
                    except ValueError:
                        continue
            
            # Try table-based extraction if regex didn't work
            if rsi is None or stochastic is None:
                try:
                    tables = soup.find_all("table")
                    for table in tables:
                        rows = table.find_all("tr")
                        for row in rows:
                            cells = row.find_all(["td", "th"])
                            if len(cells) >= 2:
                                cell_text = cells[0].get_text(strip=True)
                                value_cell = cells[1].get_text(strip=True)
                                
                                # Look for RSI
                                if rsi is None and "rsi" in cell_text.lower() and "14" in cell_text.lower():
                                    value_match = re.search(r"([\d]+\.?\d*)", value_cell)
                                    if value_match:
                                        try:
                                            rsi = float(value_match.group(1))
                                            print(f"    ✓ Found RSI(14) in table: {rsi}")
                                        except ValueError:
                                            pass
                                
                                # Look for Stochastic
                                if stochastic is None and "stochastic" in cell_text.lower() and "14" in cell_text.lower():
                                    value_match = re.search(r"([\d]+\.?\d*)", value_cell)
                                    if value_match:
                                        try:
                                            stochastic = float(value_match.group(1))
                                            print(f"    ✓ Found Stochastic(14) in table: {stochastic}")
                                        except ValueError:
                                            pass
                                
                                if rsi is not None and stochastic is not None:
                                    break
                        if rsi is not None and stochastic is not None:
                            break
                except Exception as e:
                    print(f"    ⚠ Error searching tables: {str(e)}")
            
            # Store values
            company.rsi = rsi
            company.stochastic = stochastic
            
            # Determine action based on rules
            if rsi is not None and stochastic is not None:
                if rsi <= 35 and stochastic <= 25:
                    company.action = "buy"
                    print(f"    ✓ Action: BUY (RSI={rsi} <= 35 AND Stochastic={stochastic} <= 25)")
                elif rsi >= 70 and stochastic >= 75:
                    company.action = "sell"
                    print(f"    ✓ Action: SELL (RSI={rsi} >= 70 AND Stochastic={stochastic} >= 75)")
                else:
                    company.action = "hold"
                    print(f"    ✓ Action: HOLD (RSI={rsi}, Stochastic={stochastic})")
            else:
                company.action = "hold"  # Default to hold if values not found
                if rsi is None:
                    print(f"    ⚠ RSI(14) not found, defaulting to hold")
                if stochastic is None:
                    print(f"    ⚠ Stochastic(14) not found, defaulting to hold")
            
            analyzed_companies.append(company)
            
            # Small delay to avoid overwhelming the server
            time.sleep(0.5)
            
        except requests.exceptions.RequestException as e:
            print(f"  [RSI_STOCHASTIC.{idx}] ⚠ Request error for {company.name}: {str(e)}")
            errors += 1
            company.rsi = None
            company.stochastic = None
            company.action = "hold"
            analyzed_companies.append(company)
        except Exception as e:
            print(f"  [RSI_STOCHASTIC.{idx}] ⚠ Error processing {company.name}: {str(e)}")
            errors += 1
            company.rsi = None
            company.stochastic = None
            company.action = "hold"
            analyzed_companies.append(company)
    
    # Count actions
    buy_count = sum(1 for c in analyzed_companies if c.action == "buy")
    sell_count = sum(1 for c in analyzed_companies if c.action == "sell")
    hold_count = sum(1 for c in analyzed_companies if c.action == "hold")
    
    print(f"[RSI_STOCHASTIC] ✓ Analysis complete:")
    print(f"  - Total companies: {len(analyzed_companies)}")
    print(f"  - Buy signals: {buy_count}")
    print(f"  - Sell signals: {sell_count}")
    print(f"  - Hold signals: {hold_count}")
    print(f"  - Errors: {errors}")
    
    agent_logger.log_agent_end(
        input_data={"total_companies": len(companies)},
        output_data={
            "analyzed_count": len(analyzed_companies),
            "buy_signals": buy_count,
            "sell_signals": sell_count,
            "hold_signals": hold_count,
            "errors": errors
        }
    )
    
    return analyzed_companies


def _get_available_model(preferred: str = "llama3.2") -> str:
    """
    Get an available Ollama model, preferring the specified one.
    
    Args:
        preferred: Preferred model name (default: llama3.2)
        
    Returns:
        Available model name
    """
    if not OLLAMA_AVAILABLE:
        raise ImportError("Ollama package not available. Install with: pip install ollama")
    
    try:
        models = ollama.list()
        available_models = [model.get('name', '') for model in models.get('models', [])]
        
        if preferred in available_models:
            return preferred
        
        if available_models:
            print(f"  ⚠ Preferred model '{preferred}' not found. Using '{available_models[0]}' instead.")
            return available_models[0]
        
        raise Exception("No Ollama models available. Pull a model with: ollama pull llama3.2")
    except Exception as e:
        if "not found" in str(e).lower() or "no models" in str(e).lower():
            raise Exception(f"No Ollama models available. Pull a model with: ollama pull {preferred}")
        raise


def _call_ollama(prompt: str, model: str = "llama3.2") -> str:
    """
    Call Ollama LLM with a prompt.
    
    Args:
        prompt: The prompt to send to the LLM
        model: The Ollama model to use (default: llama3.2)
        
    Returns:
        LLM response text
    """
    if not OLLAMA_AVAILABLE:
        raise ImportError("Ollama package not available. Install with: pip install ollama")
    
    try:
        # Get an available model (fallback if specified model not found)
        available_model = _get_available_model(model)
        
        response = ollama.chat(model=available_model, messages=[
            {"role": "user", "content": prompt}
        ])
        return response['message']['content']
    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise Exception(f"Ollama model '{model}' not found. Available models: {_get_available_models_list()}. Pull the model with: ollama pull {model}")
        raise Exception(f"Ollama API error: {str(e)}")


def _get_available_models_list() -> str:
    """Get a comma-separated list of available models."""
    try:
        if not OLLAMA_AVAILABLE:
            return "N/A"
        models = ollama.list()
        available_models = [model.get('name', '') for model in models.get('models', [])]
        return ", ".join(available_models) if available_models else "None"
    except:
        return "N/A"


@log_agent_execution("annual_report_agent")
def get_annual_report_pdfs(company_code: str) -> List[str]:
    """
    Get all PDF links from the Annual Reports page for a company.
    
    This function:
    1. Navigates to the company detail page
    2. Clicks on the "Annual" link
    3. Clicks on the first "View" link
    4. Extracts all PDF file URLs
    
    Args:
        company_code: Company code (e.g., "5211", "1295")
        
    Returns:
        List of PDF URLs
        
    Example:
        pdfs = get_annual_report_pdfs("5211")
    """
    agent_logger = AgentLogger("annual_report_agent")
    agent_logger.log_agent_start({"company_code": company_code})
    
    print(f"[ANNUAL_REPORTS] Starting PDF extraction for company code: {company_code}")
    
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
    except ImportError:
        error_msg = "Selenium not available"
        print(f"  ⚠ {error_msg}")
        agent_logger.error(error_msg)
        return []
    
    detail_url = f"https://www.klsescreener.com/v2/stocks/view/{company_code}"
    driver = None
    pdf_urls = []
    
    try:
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        # Initialize driver
        try:
            service = Service()
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except:
            driver = webdriver.Chrome(options=chrome_options)
        
        # Step 1: Navigate to company detail page
        print(f"  [STEP 1] Navigating to {detail_url}...")
        driver.get(detail_url)
        time.sleep(3)
        print(f"  [STEP 1.1] Current URL: {driver.current_url}")
        print(f"  [STEP 1.2] Page title: {driver.title}")
        
        # Debug: Print all links on the page
        print(f"  [DEBUG] Finding all links on the page...")
        all_links = driver.find_elements(By.TAG_NAME, "a")
        print(f"  [DEBUG] Found {len(all_links)} links on the page")
        
        # Print links that might be related to Annual
        annual_related = []
        for link in all_links:
            try:
                text = link.text.strip()
                href = link.get_attribute("href") or ""
                if text and ("annual" in text.lower() or "report" in text.lower() or "financial" in text.lower()):
                    annual_related.append(f"    - Text: '{text}' | Href: '{href}'")
            except:
                continue
        
        if annual_related:
            print(f"  [DEBUG] Links related to Annual/Reports:")
            for link_info in annual_related[:10]:  # Show first 10
                print(link_info)
        else:
            print(f"  [DEBUG] No links found containing 'annual', 'report', or 'financial'")
        
        # Step 2: Find and click "Annual" link
        print(f"  [STEP 2] Looking for 'Annual' link...")
        annual_link = None
        
        # Try multiple selectors for Annual link
        annual_selectors = [
            (By.LINK_TEXT, "Annual"),
            (By.PARTIAL_LINK_TEXT, "Annual"),
            (By.XPATH, "//a[contains(text(), 'Annual')]"),
            (By.XPATH, "//a[contains(@href, 'annual')]"),
            (By.XPATH, "//a[contains(translate(text(), 'ANNUAL', 'annual'), 'annual')]"),
        ]
        
        for selector_type, selector_value in annual_selectors:
            try:
                annual_link = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((selector_type, selector_value))
                )
                print(f"  ✓ Found 'Annual' link using: {selector_type} = '{selector_value}'")
                print(f"    Link text: '{annual_link.text}'")
                print(f"    Link href: '{annual_link.get_attribute('href')}'")
                break
            except Exception as e:
                print(f"  ⚠ Failed with {selector_type}: {str(e)[:100]}")
                continue
        
        if not annual_link:
            print(f"  ⚠ 'Annual' link not found on page")
            print(f"  [DEBUG] Saving page source for inspection...")
            page_source_snippet = driver.page_source[:2000]
            print(f"  [DEBUG] Page source (first 2000 chars):\n{page_source_snippet}")
            return []
        
        # Check if link is clickable
        print(f"  [STEP 2.1] Checking if 'Annual' link is clickable...")
        try:
            WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, f"//a[text()='{annual_link.text}']"))
            )
            print(f"  ✓ 'Annual' link is clickable")
        except:
            print(f"  ⚠ 'Annual' link may not be clickable, attempting anyway...")
        
        # Click the Annual link
        print(f"  [STEP 2.2] Clicking 'Annual' link...")
        current_url_before = driver.current_url
        driver.execute_script("arguments[0].scrollIntoView(true);", annual_link)
        time.sleep(0.5)
        
        try:
            annual_link.click()
            print(f"  ✓ Clicked 'Annual' link")
        except Exception as e:
            print(f"  ⚠ Normal click failed: {str(e)[:100]}, trying JavaScript click...")
            driver.execute_script("arguments[0].click();", annual_link)
            print(f"  ✓ Clicked 'Annual' link using JavaScript")
        
        time.sleep(3)
        current_url_after = driver.current_url
        print(f"  [STEP 2.3] URL before click: {current_url_before}")
        print(f"  [STEP 2.4] URL after click: {current_url_after}")
        print(f"  [STEP 2.5] Page title after click: {driver.title}")
        
        if current_url_before == current_url_after:
            print(f"  ⚠ URL did not change after clicking Annual link - page may not have navigated")
        else:
            print(f"  ✓ URL changed - successfully navigated to new page")
        
        # Step 3: Find and click first "View" link
        print(f"  [STEP 3] Looking for first 'View' link...")
        
        # Debug: Print all links on current page
        print(f"  [DEBUG] Finding all links on the current page...")
        all_links_now = driver.find_elements(By.TAG_NAME, "a")
        print(f"  [DEBUG] Found {len(all_links_now)} links on the current page")
        
        # Print links that contain "View" or might be relevant
        view_related = []
        for idx, link in enumerate(all_links_now[:50]):  # Check first 50 links
            try:
                text = link.text.strip()
                href = link.get_attribute("href") or ""
                if text and ("view" in text.lower() or "pdf" in href.lower() or "download" in text.lower()):
                    view_related.append(f"    [{idx}] Text: '{text}' | Href: '{href[:100]}'")
            except:
                continue
        
        if view_related:
            print(f"  [DEBUG] Links related to View/PDF/Download:")
            for link_info in view_related[:20]:  # Show first 20
                print(link_info)
        else:
            print(f"  [DEBUG] No links found containing 'view', 'pdf', or 'download'")
        
        view_link = None
        
        # Try multiple selectors for View link
        view_selectors = [
            (By.LINK_TEXT, "View"),
            (By.PARTIAL_LINK_TEXT, "View"),
            (By.XPATH, "//a[contains(text(), 'View')]"),
            (By.XPATH, "//a[contains(@href, 'view')]"),
            (By.XPATH, "//a[contains(translate(text(), 'VIEW', 'view'), 'view')]"),
        ]
        
        for selector_type, selector_value in view_selectors:
            try:
                # Find the first View link
                view_link = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((selector_type, selector_value))
                )
                print(f"  ✓ Found first 'View' link using: {selector_type} = '{selector_value}'")
                print(f"    Link text: '{view_link.text}'")
                print(f"    Link href: '{view_link.get_attribute('href')}'")
                break
            except Exception as e:
                print(f"  ⚠ Failed with {selector_type}: {str(e)[:100]}")
                continue
        
        if not view_link:
            print(f"  ⚠ 'View' link not found on page")
            print(f"  [DEBUG] Saving page source for inspection...")
            page_source_snippet = driver.page_source[:2000]
            print(f"  [DEBUG] Page source (first 2000 chars):\n{page_source_snippet}")
            return []
        
        # Check if link is clickable
        print(f"  [STEP 3.1] Checking if 'View' link is clickable...")
        try:
            WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, f"//a[text()='{view_link.text}']"))
            )
            print(f"  ✓ 'View' link is clickable")
        except:
            print(f"  ⚠ 'View' link may not be clickable, attempting anyway...")
        
        # Click the first View link
        print(f"  [STEP 3.2] Clicking first 'View' link...")
        current_url_before_view = driver.current_url
        driver.execute_script("arguments[0].scrollIntoView(true);", view_link)
        time.sleep(0.5)
        
        try:
            view_link.click()
            print(f"  ✓ Clicked first 'View' link")
        except Exception as e:
            print(f"  ⚠ Normal click failed: {str(e)[:100]}, trying JavaScript click...")
            driver.execute_script("arguments[0].click();", view_link)
            print(f"  ✓ Clicked 'View' link using JavaScript")
        
        time.sleep(3)
        current_url_after_view = driver.current_url
        print(f"  [STEP 3.3] URL before click: {current_url_before_view}")
        print(f"  [STEP 3.4] URL after click: {current_url_after_view}")
        print(f"  [STEP 3.5] Page title after click: {driver.title}")
        
        if current_url_before_view == current_url_after_view:
            print(f"  ⚠ URL did not change after clicking View link - checking for new tab or iframe...")
            # Check if new window/tab was opened
            if len(driver.window_handles) > 1:
                print(f"  ✓ New window/tab opened, switching to it...")
                driver.switch_to.window(driver.window_handles[-1])
                print(f"  [STEP 3.6] New tab URL: {driver.current_url}")
                time.sleep(2)
            else:
                print(f"  ⚠ No new window opened and URL didn't change")
        else:
            print(f"  ✓ URL changed - successfully navigated to new page")
        
        # Step 4: Extract all PDF attachments from announcement page
        print(f"  [STEP 4] Extracting PDF attachments from announcement page...")
        print(f"  [STEP 4.1] Current URL: {driver.current_url}")
        
        # Strategy 1: Look for attachment links (common patterns for announcements pages)
        print(f"  [STEP 4.2] Looking for attachment links...")
        
        # Try to find attachments section
        attachment_selectors = [
            (By.XPATH, "//a[contains(@href, '.pdf')]"),
            (By.XPATH, "//a[contains(@href, '/attachments/')]"),
            (By.XPATH, "//a[contains(@href, '/download/')]"),
            (By.XPATH, "//div[contains(@class, 'attachment')]//a"),
            (By.XPATH, "//div[contains(@class, 'file')]//a"),
            (By.CSS_SELECTOR, "a[href*='.pdf']"),
        ]
        
        all_attachment_links = []
        for selector_type, selector_value in attachment_selectors:
            try:
                links = driver.find_elements(selector_type, selector_value)
                all_attachment_links.extend(links)
                if links:
                    print(f"  ✓ Found {len(links)} links using: {selector_type}")
            except:
                continue
        
        # Remove duplicates based on href
        seen_hrefs = set()
        unique_links = []
        for link in all_attachment_links:
            try:
                href = link.get_attribute("href")
                if href and href not in seen_hrefs:
                    seen_hrefs.add(href)
                    unique_links.append(link)
            except:
                continue
        
        print(f"  [DEBUG] Found {len(unique_links)} unique attachment links")
        
        # Extract PDF information (filter for IR/IAR/Integrated Annual Report only)
        for idx, link in enumerate(unique_links, 1):
            try:
                href = link.get_attribute("href")
                link_text = link.text.strip()
                
                # Check if it's a PDF
                if href and (".pdf" in href.lower() or "pdf" in link_text.lower()):
                    # Filter: Only include PDFs with IR, IAR, or "Integrated Annual Report" keywords
                    combined_text = f"{link_text} {href}".lower()
                    
                    # Exclude ESG and CG reports first
                    is_excluded = (
                        "esg" in combined_text or
                        "cg report" in combined_text or
                        "corporate governance" in combined_text or
                        "sustainability report" in combined_text or
                        "sr2" in combined_text  # Pattern like SR2024
                    )
                    
                    if is_excluded:
                        print(f"    [{idx}] ⊗ Skipped (ESG/CG/SR): {link_text}")
                        continue
                    
                    # Check for IR/IAR/Annual Report/Integrated Report keywords (must be specific patterns)
                    is_iar = (
                        " iar" in combined_text or 
                        "-iar" in combined_text or
                        "iar2" in combined_text or  # Pattern like IAR2024
                        "iar " in combined_text or
                        combined_text.startswith("iar") or
                        " ir2" in combined_text or  # Pattern like IR2024, IR2025
                        "-ir2" in combined_text or
                        "ir 2" in combined_text or
                        "integrated annual report" in combined_text or
                        "intergrated annual report" in combined_text or  # Common typo
                        "integrated report" in combined_text or  # Include Integrated Report PDFs
                        "annual report" in combined_text or  # Include Annual Report PDFs
                        (combined_text.startswith("ir") and any(char.isdigit() for char in combined_text[:6]))  # IR followed by digits
                    )
                    
                    if is_iar:
                        pdf_urls.append(href)
                        print(f"    [{idx}] ✓ IAR PDF: {link_text}")
                        print(f"        URL: {href}")
                    else:
                        print(f"    [{idx}] ⊗ Skipped (not IAR): {link_text}")
            except Exception as e:
                print(f"    [{idx}] ⚠ Error extracting link: {str(e)[:100]}")
                continue
        
        # Strategy 2: If no PDFs found, search all links on the page
        if not pdf_urls:
            print(f"  [STEP 4.3] No IAR PDFs found with attachment selectors, scanning all links...")
            all_links = driver.find_elements(By.TAG_NAME, "a")
            print(f"  [DEBUG] Found {len(all_links)} total links on the page")
            
            for idx, link in enumerate(all_links, 1):
                try:
                    href = link.get_attribute("href")
                    link_text = link.text.strip()
                    
                    if href and href.lower().endswith(".pdf"):
                        # Filter: Only include PDFs with IR, IAR, or "Integrated Annual Report" keywords
                        combined_text = f"{link_text} {href}".lower()
                        
                        # Exclude ESG and CG reports first
                        is_excluded = (
                            "esg" in combined_text or
                            "cg report" in combined_text or
                            "corporate governance" in combined_text or
                            "sustainability report" in combined_text or
                            "sr2" in combined_text
                        )
                        
                        if is_excluded:
                            print(f"    [{idx}] ⊗ Skipped (ESG/CG/SR): {link_text}")
                            continue
                        
                        is_iar = (
                            " iar" in combined_text or 
                            "-iar" in combined_text or
                            "iar2" in combined_text or
                            "iar " in combined_text or
                            combined_text.startswith("iar") or
                            " ir2" in combined_text or
                            "-ir2" in combined_text or
                            "ir 2" in combined_text or
                            "integrated annual report" in combined_text or
                            "intergrated annual report" in combined_text or
                            "integrated report" in combined_text or
                            "annual report" in combined_text or
                            (combined_text.startswith("ir") and any(char.isdigit() for char in combined_text[:6]))
                        )
                        
                        if is_iar:
                            pdf_urls.append(href)
                            print(f"    [{idx}] ✓ IAR PDF: {link_text}")
                            print(f"        URL: {href}")
                        else:
                            print(f"    [{idx}] ⊗ Skipped (not IAR): {link_text}")
                except:
                    continue
        
        # Strategy 3: Check page source for PDF URLs
        if not pdf_urls:
            print(f"  [STEP 4.4] No IAR PDF links found in <a> tags, checking page source...")
            page_source = driver.page_source
            
            # Find PDF URLs in the page source using regex
            pdf_patterns = [
                r'href=["\']([^"\']*\.pdf[^"\']*)["\']',
                r'(https?://[^\s<>"\']+\.pdf)',
                r'src=["\']([^"\']*\.pdf[^"\']*)["\']',
            ]
            
            for pattern in pdf_patterns:
                found_pdfs = re.findall(pattern, page_source, re.IGNORECASE)
                if found_pdfs:
                    print(f"  ✓ Found {len(found_pdfs)} PDFs with pattern: {pattern[:50]}...")
                    for pdf_url in found_pdfs:
                        # Make relative URLs absolute
                        if pdf_url.startswith("/"):
                            pdf_url = f"https://www.klsescreener.com{pdf_url}"
                        
                        # Filter: Only include PDFs with IR, IAR, or "Integrated Annual Report" keywords
                        url_lower = pdf_url.lower()
                        
                        # Exclude ESG and CG reports first
                        is_excluded = (
                            "esg" in url_lower or
                            "cg report" in url_lower or
                            "corporate governance" in url_lower or
                            "sustainability report" in url_lower or
                            "sr2" in url_lower
                        )
                        
                        if is_excluded:
                            print(f"    ⊗ Skipped (ESG/CG/SR): {pdf_url}")
                            continue
                        
                        is_iar = (
                            " iar" in url_lower or 
                            "-iar" in url_lower or
                            "iar2" in url_lower or
                            "iar " in url_lower or
                            url_lower.split("/")[-1].startswith("iar") or
                            " ir2" in url_lower or
                            "-ir2" in url_lower or
                            "ir 2" in url_lower or
                            "integrated annual report" in url_lower or
                            "intergrated annual report" in url_lower or
                            "integrated report" in url_lower or
                            "annual report" in url_lower or
                            (url_lower.split("/")[-1].startswith("ir") and any(char.isdigit() for char in url_lower.split("/")[-1][:6]))
                        )
                        
                        if is_iar:
                            pdf_urls.append(pdf_url)
                            print(f"    ✓ Found IAR PDF in source: {pdf_url}")
                        else:
                            print(f"    ⊗ Skipped (not IAR): {pdf_url}")
        
        # If still no PDFs found, show debug info
        if not pdf_urls:
            print(f"  [DEBUG] No IAR PDF links found - showing page info for debugging:")
            print(f"  [DEBUG] Page title: {driver.title}")
            
            # Show all PDF filenames found (even non-IAR ones) for debugging
            print(f"  [DEBUG] All PDFs found on page (including non-IAR):")
            all_links = driver.find_elements(By.TAG_NAME, "a")
            all_pdf_count = 0
            for link in all_links:
                try:
                    href = link.get_attribute("href")
                    text = link.text.strip()
                    if href and href.lower().endswith(".pdf"):
                        all_pdf_count += 1
                        print(f"    - {text} | {href}")
                except:
                    continue
            
            if all_pdf_count == 0:
                print(f"  [DEBUG] No PDF links at all found on page")
                print(f"  [DEBUG] Page source snippet (first 2000 chars):")
                print(driver.page_source[:2000])
            
            # Try to find any attachments section
            print(f"  [DEBUG] Looking for 'attachment' or 'file' text in page...")
            if "attachment" in driver.page_source.lower():
                print(f"  ✓ Found 'attachment' keyword in page")
                # Extract context around 'attachment'
                idx = driver.page_source.lower().find("attachment")
                context = driver.page_source[max(0, idx-200):min(len(driver.page_source), idx+500)]
                print(f"  [DEBUG] Context around 'attachment':\n{context}")
        
        # Remove duplicates
        pdf_urls = list(set(pdf_urls))
        
        print(f"[ANNUAL_REPORTS] ✓ Extraction complete: Found {len(pdf_urls)} IAR PDF files")
        
        agent_logger.log_agent_end(
            input_data={"company_code": company_code},
            output_data={"pdf_count": len(pdf_urls), "pdf_urls": pdf_urls}
        )
        
        return pdf_urls
        
    except Exception as e:
        error_msg = f"Error extracting annual report PDFs: {str(e)}"
        print(f"  ⚠ {error_msg}")
        agent_logger.error(error_msg)
        return []
    finally:
        if driver:
            driver.quit()


def _extract_company_name_from_query(query: str) -> str:
    """
    Extract company name/ticker from natural language query using LLM.
    
    Args:
        query: Natural language query (e.g., "can I buy AMBANK now")
        
    Returns:
        Extracted company name/ticker (e.g., "AMBANK")
    """
    prompt = f"""Extract the company name or stock ticker from the following query. 
Return ONLY the company name or ticker, nothing else.

Query: {query}

Company name/ticker:"""
    
    try:
        result = _call_ollama(prompt)
        # Clean up the response - remove quotes, whitespace, etc.
        company_name = result.strip().strip('"').strip("'").strip()
        return company_name
    except Exception as e:
        # Fallback: try to extract using regex patterns
        print(f"  ⚠ LLM extraction failed: {str(e)}, trying regex fallback...")
        # Look for common patterns like "buy AMBANK", "AMBANK stock", etc.
        patterns = [
            r"(?:buy|sell|purchase|invest in|trade)\s+([A-Z]{2,})",
            r"([A-Z]{2,})\s+(?:stock|shares|now|today)",
            r"([A-Z]{2,})\s*$",
        ]
        for pattern in patterns:
            match = re.search(pattern, query, re.IGNORECASE)
            if match:
                return match.group(1).upper()
        # Last resort: return first uppercase word
        words = query.split()
        for word in words:
            if word.isupper() and len(word) >= 2:
                return word
        raise ValueError(f"Could not extract company name from query: {query}")


@log_agent_execution("get_companies_by_sector_agent")
def get_companies_by_sector_name(sector: str) -> List[Company]:
    """
    Get all companies in a sector by searching KLSE Screener's sector/subsector dropdowns.
    
    This function takes a sector name (e.g., from a Company object), finds it in the
    sector or subsector dropdown on KLSE Screener, clicks Screen, and returns all companies.
    
    Args:
        sector: Sector name (e.g., "Diversified Industrials", "Financial Services", "Technology")
        
    Returns:
        List of Company objects in the sector
        
    Example:
        # Get all companies in the same sector as a company
        companies = get_companies_by_sector_name(my_company.sector)
    """
    agent_logger = AgentLogger("get_companies_by_sector_agent")
    agent_logger.log_agent_start({"sector": sector})
    
    print(f"[SECTOR_COMPANIES] Starting sector company extraction for sector: '{sector}'")
    
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.support.ui import Select
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
    except ImportError:
        print(f"  ⚠ Selenium not available")
        agent_logger.log_agent_error("Selenium not available")
        return []
    
    base_url = "https://www.klsescreener.com/v2/"
    driver = None
    companies = []
    
    try:
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        # Initialize driver
        try:
            service = Service()
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except:
            driver = webdriver.Chrome(options=chrome_options)
        
        print(f"  [STEP 1] Navigating to {base_url}...")
        driver.get(base_url)
        time.sleep(2)
        
        # Step 2: Try to find and select sector in dropdown
        print(f"  [STEP 2] Trying to filter by sector '{sector}'...")
        sector_found = False
        
        try:
            # Find sector dropdown
            sector_select = None
            sector_selectors = [
                (By.NAME, "sector"),
                (By.ID, "sector"),
                (By.XPATH, "//select[@name='sector']"),
            ]
            
            for selector_type, selector_value in sector_selectors:
                try:
                    sector_select = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((selector_type, selector_value))
                    )
                    print(f"  ✓ Found sector dropdown using: {selector_type} = '{selector_value}'")
                    break
                except:
                    continue
            
            if sector_select:
                select = Select(sector_select)
                options = select.options
                
                # Try to find matching sector
                for option in options:
                    option_text = option.text.strip()
                    # Skip empty options and ensure both sector and option_text are not empty
                    if option_text and sector and (sector.lower() in option_text.lower() or option_text.lower() in sector.lower()):
                        print(f"  ✓ Found matching sector option: '{option_text}'")
                        select.select_by_visible_text(option_text)
                        sector_found = True
                        time.sleep(1)
                        break
                
                if not sector_found:
                    print(f"  ⚠ Sector '{sector}' not found in sector dropdown, trying subsector...")
            
        except Exception as e:
            print(f"  ⚠ Error selecting sector: {str(e)}")
        
        # Step 3: If sector not found, try subsector
        if not sector_found:
            print(f"  [STEP 3] Trying to filter by subsector '{sector}'...")
            try:
                # Find subsector dropdown
                subsector_select = None
                subsector_selectors = [
                    (By.NAME, "subsector"),
                    (By.ID, "subsector"),
                    (By.XPATH, "//select[@name='subsector']"),
                ]
                
                for selector_type, selector_value in subsector_selectors:
                    try:
                        subsector_select = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((selector_type, selector_value))
                        )
                        print(f"  ✓ Found subsector dropdown using: {selector_type} = '{selector_value}'")
                        break
                    except:
                        continue
                
                if subsector_select:
                    select = Select(subsector_select)
                    options = select.options
                    
                    # Try to find matching subsector
                    for option in options:
                        option_text = option.text.strip()
                        # Skip empty options and ensure both sector and option_text are not empty
                        if option_text and sector and (sector.lower() in option_text.lower() or option_text.lower() in sector.lower()):
                            print(f"  ✓ Found matching subsector option: '{option_text}'")
                            select.select_by_visible_text(option_text)
                            sector_found = True
                            time.sleep(1)
                            break
                    
                    if not sector_found:
                        print(f"  ⚠ Subsector '{sector}' not found in subsector dropdown")
            except Exception as e:
                print(f"  ⚠ Error selecting subsector: {str(e)}")
        
        # Step 4: Click Screen button to apply filter
        if sector_found:
            print(f"  [STEP 4] Clicking Screen button...")
            try:
                screen_button = driver.find_element(By.XPATH, "//input[@type='submit' and contains(@value, 'Screen')]")
                screen_button.click()
                print(f"  ✓ Clicked Screen button")
                time.sleep(5)  # Wait longer for results to load and filter to apply
                
                # Verify the page has loaded filtered results
                # Check that we're not on the main page with all companies
                current_url = driver.current_url
                print(f"  [STEP 4.1] Current URL after filtering: {current_url}")
                
                # Step 5: Extract all companies from the results table
                print(f"  [STEP 5] Extracting companies from results table...")
                companies = _extract_companies_from_table(driver, sector)
                print(f"  ✓ Extracted {len(companies)} companies from sector '{sector}'")
                
                # Additional validation: Check if companies are actually from the sector
                if companies:
                    print(f"  [STEP 5.1] Validating filtered results...")
                    print(f"  [STEP 5.1] First company: {companies[0].name} ({companies[0].code}) - Sector: {companies[0].sector}")
                    if len(companies) > 100:
                        print(f"  [STEP 5.1] ⚠ Warning: {len(companies)} companies found - this might be too many, filter may not have applied correctly")
                
            except Exception as e:
                print(f"  ⚠ Error clicking Screen button or extracting companies: {str(e)}")
        else:
            print(f"  ⚠ Could not find sector '{sector}' in sector or subsector dropdowns")
        
        # Step 6: Filter companies by financial criteria
        if companies:
            print(f"  [STEP 6] Filtering companies by financial criteria...")
            print(f"    - PE Ratio <= 25")
            print(f"    - Market Cap <= 200M")
            print(f"    - ROE >= 12")
            
            initial_count = len(companies)
            filtered_companies = []
            
            for company in companies:
                # Check filtering criteria
                pe_ok = company.pe_ratio is not None and company.pe_ratio <= 25
                market_cap_ok = company.market_cap is not None and company.market_cap <= 200
                roe_ok = company.roe is not None and company.roe >= 12
                
                if pe_ok and market_cap_ok and roe_ok:
                    filtered_companies.append(company)
                    print(f"    ✓ {company.name} ({company.code}): PE={company.pe_ratio}, Cap={company.market_cap}M, ROE={company.roe}")
                else:
                    reasons = []
                    if not pe_ok:
                        reasons.append(f"PE={company.pe_ratio}")
                    if not market_cap_ok:
                        reasons.append(f"Cap={company.market_cap}M")
                    if not roe_ok:
                        reasons.append(f"ROE={company.roe}")
                    print(f"    ⊗ {company.name} ({company.code}): Filtered out ({', '.join(reasons)})")
            
            companies = filtered_companies
            print(f"  ✓ Filtering complete: {initial_count} → {len(companies)} companies")
        
        # Step 7: Fetch average volume for filtered companies
        if companies:
            print(f"  [STEP 7] Fetching average volume for {len(companies)} filtered companies...")
            companies = fetch_average_volume_for_companies(companies)
            print(f"  ✓ Volume fetching complete")
        
        agent_logger.log_agent_end(
            input_data={"sector": sector},
            output_data={"company_count": len(companies)}
        )
        
        return companies
        
    except Exception as e:
        error_msg = f"Error fetching companies by sector: {str(e)}"
        print(f"  ⚠ {error_msg}")
        agent_logger.error(error_msg)
        return []
    finally:
        if driver:
            driver.quit()


def _search_company_by_sector(company_name: str, sector: str) -> Optional[Dict]:
    """
    Search for company by filtering by sector or subsector.
    
    First tries to find company in the sector dropdown, then tries subsector.
    
    Args:
        company_name: Company name to search for
        sector: Sector name (e.g., "Diversified Industrials")
        
    Returns:
        Dictionary with company data or None if not found
    """
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.support.ui import Select
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
    except ImportError:
        print(f"  ⚠ Selenium not available for sector-based search")
        return None
    
    base_url = "https://www.klsescreener.com/v2/"
    driver = None
    
    try:
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        # Initialize driver
        try:
            service = Service()
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except:
            driver = webdriver.Chrome(options=chrome_options)
        
        print(f"  [SECTOR_SEARCH] Navigating to {base_url}...")
        driver.get(base_url)
        time.sleep(2)
        
        # Step 1: Try to find company in sector dropdown
        print(f"  [SECTOR_SEARCH] Step 1: Trying to filter by sector '{sector}'...")
        sector_found = False
        
        try:
            # Find sector dropdown
            sector_select = None
            sector_selectors = [
                (By.NAME, "sector"),
                (By.ID, "sector"),
                (By.XPATH, "//select[@name='sector']"),
            ]
            
            for selector_type, selector_value in sector_selectors:
                try:
                    sector_select = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((selector_type, selector_value))
                    )
                    print(f"  ✓ Found sector dropdown using: {selector_type} = '{selector_value}'")
                    break
                except:
                    continue
            
            if sector_select:
                select = Select(sector_select)
                options = select.options
                
                # Try to find matching sector
                for option in options:
                    option_text = option.text.strip()
                    if sector.lower() in option_text.lower() or option_text.lower() in sector.lower():
                        print(f"  ✓ Found matching sector option: '{option_text}'")
                        select.select_by_visible_text(option_text)
                        sector_found = True
                        time.sleep(1)
                        break
                
                if not sector_found:
                    print(f"  ⚠ Sector '{sector}' not found in sector dropdown")
            
        except Exception as e:
            print(f"  ⚠ Error selecting sector: {str(e)}")
        
        # Step 2: If sector not found or company not in sector results, try subsector
        if not sector_found:
            print(f"  [SECTOR_SEARCH] Step 2: Trying to filter by subsector '{sector}'...")
            try:
                # Find subsector dropdown
                subsector_select = None
                subsector_selectors = [
                    (By.NAME, "subsector"),
                    (By.ID, "subsector"),
                    (By.XPATH, "//select[@name='subsector']"),
                ]
                
                for selector_type, selector_value in subsector_selectors:
                    try:
                        subsector_select = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((selector_type, selector_value))
                        )
                        print(f"  ✓ Found subsector dropdown using: {selector_type} = '{selector_value}'")
                        break
                    except:
                        continue
                
                if subsector_select:
                    select = Select(subsector_select)
                    options = select.options
                    
                    # Try to find matching subsector
                    for option in options:
                        option_text = option.text.strip()
                        if sector.lower() in option_text.lower() or option_text.lower() in sector.lower():
                            print(f"  ✓ Found matching subsector option: '{option_text}'")
                            select.select_by_visible_text(option_text)
                            sector_found = True
                            time.sleep(1)
                            break
                    
                    if not sector_found:
                        print(f"  ⚠ Subsector '{sector}' not found in subsector dropdown")
            except Exception as e:
                print(f"  ⚠ Error selecting subsector: {str(e)}")
        
        # Step 3: Click Screen button to apply filter
        if sector_found:
            print(f"  [SECTOR_SEARCH] Step 3: Clicking Screen button...")
            try:
                screen_button = driver.find_element(By.XPATH, "//input[@type='submit' and contains(@value, 'Screen')]")
                screen_button.click()
                print(f"  ✓ Clicked Screen button")
                time.sleep(3)  # Wait for results to load
                
                # Step 4: Search for company in the filtered results
                print(f"  [SECTOR_SEARCH] Step 4: Searching for '{company_name}' in filtered results...")
                tables = driver.find_elements(By.TAG_NAME, "table")
                
                for table in tables:
                    try:
                        rows = table.find_elements(By.TAG_NAME, "tr")
                        for row in rows[1:]:  # Skip header
                            cells = row.find_elements(By.TAG_NAME, "td")
                            if len(cells) >= 2:
                                first_cell_text = cells[0].text.strip()
                                second_cell_text = cells[1].text.strip()
                                
                                # Check if this row matches the company
                                if (company_name.upper() in first_cell_text.upper() or 
                                    company_name.upper() in second_cell_text.upper()):
                                    print(f"  ✓ Found company in filtered results")
                                    # Click on the company link
                                    try:
                                        link = cells[0].find_element(By.TAG_NAME, "a")
                                        link.click()
                                        time.sleep(3)
                                        
                                        # Extract company data from detail page
                                        company_data = _extract_company_from_detail_page(driver, company_name)
                                        return company_data
                                    except:
                                        pass
                    except:
                        continue
                
                print(f"  ⚠ Company '{company_name}' not found in filtered results")
            except Exception as e:
                print(f"  ⚠ Error clicking Screen button or searching: {str(e)}")
        
        return None
        
    except Exception as e:
        print(f"  ⚠ Error in sector-based search: {str(e)}")
        return None
    finally:
        if driver:
            driver.quit()


def _search_company_on_klse(company_name: str) -> Optional[Dict]:
    """
    Search for company on KLSE Screener and get company data using Selenium.
    
    Args:
        company_name: Company name or ticker to search for
        
    Returns:
        Dictionary with company data or None if not found
    """
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.common.keys import Keys
    except ImportError:
        print(f"  ⚠ Selenium not available, falling back to basic search...")
        return _search_company_basic(company_name)
    
    base_url = "https://www.klsescreener.com/v2/"
    driver = None
    
    try:
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        # Initialize driver
        try:
            service = Service()
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except:
            driver = webdriver.Chrome(options=chrome_options)
        
        print(f"  [SEARCH] Navigating to {base_url}...")
        driver.get(base_url)
        time.sleep(2)  # Wait for page to load
        
        # Find search input field
        print(f"  [SEARCH] Looking for search input field...")
        search_input = None
        search_selectors = [
            (By.NAME, "search"),
            (By.ID, "search"),
            (By.XPATH, "//input[@type='text' and contains(@placeholder, 'search')]"),
            (By.XPATH, "//input[@type='search']"),
        ]
        
        for selector_type, selector_value in search_selectors:
            try:
                search_input = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((selector_type, selector_value))
                )
                print(f"  ✓ Found search input using: {selector_type} = '{selector_value}'")
                break
            except:
                continue
        
        if not search_input:
            print(f"  ⚠ Search input not found")
            return None
        
        # Enter company name and wait for dropdown
        print(f"  [SEARCH] Entering '{company_name}' in search field...")
        search_input.clear()
        search_input.send_keys(company_name)
        print(f"  [SEARCH] Waiting for dropdown to appear...")
        time.sleep(2)  # Wait for dropdown to appear
        
        # Find and click the first option in the dropdown
        print(f"  [SEARCH] Looking for dropdown options...")
        first_dropdown_option = None
        
        try:
            # Look for dropdown/autocomplete options
            # Common patterns: ul with class containing "dropdown", "autocomplete", "suggestions", etc.
            dropdown_selectors = [
                (By.XPATH, "//ul[contains(@class, 'dropdown')]//li[1]//a"),
                (By.XPATH, "//ul[contains(@class, 'autocomplete')]//li[1]//a"),
                (By.XPATH, "//ul[contains(@class, 'suggestions')]//li[1]//a"),
                (By.XPATH, "//div[contains(@class, 'dropdown')]//a[1]"),
                (By.XPATH, "//div[contains(@class, 'autocomplete')]//a[1]"),
                (By.XPATH, "//ul[@role='listbox']//li[1]//a"),
                (By.XPATH, "//div[@role='listbox']//a[1]"),
            ]
            
            for selector_type, selector_value in dropdown_selectors:
                try:
                    first_dropdown_option = WebDriverWait(driver, 3).until(
                        EC.element_to_be_clickable((selector_type, selector_value))
                    )
                    print(f"  ✓ Found dropdown option using: {selector_type} = '{selector_value}'")
                    break
                except:
                    continue
            
            # Alternative: Look for any clickable element that appears after typing
            if not first_dropdown_option:
                print(f"  [SEARCH] Trying alternative: looking for clickable elements...")
                # Look for links or clickable divs that might be dropdown items
                try:
                    # Try to find elements that appeared after typing
                    dropdown_elements = driver.find_elements(By.XPATH, "//a[contains(text(), '- KLSE Screener')]")
                    if dropdown_elements:
                        first_dropdown_option = dropdown_elements[0]
                        print(f"  ✓ Found dropdown option via text search")
                except:
                    pass
            
            # Another alternative: Look for any list item or div that's clickable
            if not first_dropdown_option:
                try:
                    # Find any visible dropdown container
                    dropdown_containers = driver.find_elements(By.XPATH, 
                        "//ul[contains(@class, 'dropdown') or contains(@class, 'autocomplete') or contains(@class, 'menu')] | "
                        "//div[contains(@class, 'dropdown') or contains(@class, 'autocomplete')]")
                    
                    for container in dropdown_containers:
                        try:
                            # Get first clickable child (link or list item)
                            first_item = container.find_element(By.XPATH, ".//a[1] | .//li[1]//a | .//div[1]")
                            if first_item.is_displayed():
                                first_dropdown_option = first_item
                                print(f"  ✓ Found dropdown option in container")
                                break
                        except:
                            continue
                except:
                    pass
                    
        except Exception as e:
            print(f"  ⚠ Error finding dropdown: {str(e)}")
        
        if not first_dropdown_option:
            print(f"  ⚠ Dropdown option not found, trying Enter key as fallback...")
            # Fallback: Press Enter
            search_input.send_keys(Keys.RETURN)
            time.sleep(3)
        else:
            # Click the first dropdown option
            print(f"  [SEARCH] Clicking first dropdown option...")
            try:
                # Scroll into view if needed
                driver.execute_script("arguments[0].scrollIntoView(true);", first_dropdown_option)
                time.sleep(0.5)
                first_dropdown_option.click()
                print(f"  ✓ Clicked first dropdown option")
                time.sleep(3)  # Wait for detail page to load
            except Exception as e:
                print(f"  ⚠ Error clicking dropdown option: {str(e)}")
                # Try JavaScript click
                try:
                    driver.execute_script("arguments[0].click();", first_dropdown_option)
                    time.sleep(3)
                except:
                    # Final fallback: Press Enter
                    search_input.send_keys(Keys.RETURN)
                    time.sleep(3)
        
        # Now extract company data from the detail page
        print(f"  [SEARCH] Extracting company data from detail page...")
        current_url = driver.current_url
        print(f"  [SEARCH] Current URL: {current_url}")
        
        # Extract company data from the detail page
        company_data = _extract_company_from_detail_page(driver, company_name)
        
        return company_data
        
    except Exception as e:
        print(f"  ⚠ Error searching for company with Selenium: {str(e)}")
        return None
    finally:
        if driver:
            driver.quit()


def _search_company_basic(company_name: str) -> Optional[Dict]:
    """Fallback basic search without Selenium."""
    base_url = "https://www.klsescreener.com/v2/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    try:
        # Try direct search URL
        search_url = f"{base_url}?search={company_name}"
        response = requests.get(search_url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'lxml')
            tables = soup.find_all("table")
            for table in tables:
                rows = table.find_all("tr")
                for row in rows[1:]:
                    cells = row.find_all(["td", "th"])
                    if len(cells) >= 2:
                        first_cell = cells[0].get_text(strip=True)
                        second_cell = cells[1].get_text(strip=True)
                        if (company_name.upper() in first_cell.upper() or 
                            company_name.upper() in second_cell.upper()):
                            return _extract_company_from_table_row(row, company_name)
        return None
    except:
        return None


def _extract_company_from_detail_page(driver, company_name: str) -> Dict:
    """
    Extract company data from the detail page after clicking the link.
    
    Args:
        driver: Selenium WebDriver instance (already on detail page)
        company_name: Company name for reference
        
    Returns:
        Dictionary with company data
    """
    from selenium.webdriver.common.by import By
    
    company_data = {
        "name": company_name,
        "code": "",
        "detail_url": driver.current_url,
        "eps": None,
        "pe_ratio": None,
        "dividend_yield": None,
        "roe": None,
        "market_cap": None,
        "sector": "unknown"
    }
    
    try:
        # Extract code from URL first (most reliable)
        # URL format: https://www.klsescreener.com/v2/stocks/view/5398/gamuda-berhad or /03057/sancy-berhad
        current_url = driver.current_url
        url_code_match = re.search(r'/stocks/view/(\d+)/', current_url)
        if url_code_match:
            company_data["code"] = url_code_match.group(1)
            print(f"  ✓ Extracted code from URL: {company_data['code']}")
        
        # Extract financial data from tables
        tables = driver.find_elements(By.TAG_NAME, "table")
        for table in tables:
            try:
                rows = table.find_elements(By.TAG_NAME, "tr")
                for row in rows:
                    cells = row.find_elements(By.TAG_NAME, "td")
                    if len(cells) >= 2:
                        label = cells[0].text.strip().lower()
                        value = cells[1].text.strip()
                        
                        # Extract various metrics
                        if "eps" in label and not company_data["eps"]:
                            company_data["eps"] = _parse_float(value)
                        elif ("pe" in label or "p/e" in label) and "ratio" not in label.lower():
                            if not company_data["pe_ratio"]:
                                company_data["pe_ratio"] = _parse_float(value)
                        elif label == "dy" or "dy" in label or ("dividend" in label and "yield" in label):
                            if not company_data["dividend_yield"]:
                                company_data["dividend_yield"] = _parse_float(value)
                                print(f"  ✓ Extracted dividend_yield from table: {company_data['dividend_yield']}")
                        elif "roe" in label:
                            if not company_data["roe"]:
                                company_data["roe"] = _parse_float(value)
                        elif "market cap" in label or label == "market cap" or "mkt cap" in label:
                            if not company_data["market_cap"]:
                                # Parse and convert to millions (M)
                                parsed_value = _parse_float(value)
                                if parsed_value:
                                    # Convert to millions (M)
                                    company_data["market_cap"] = parsed_value / 1000000
                                    print(f"  ✓ Extracted market_cap from table: {company_data['market_cap']} (in millions)")
            except:
                continue
        
        # Extract sector from page (format: "Main Market : Diversified Industrials")
        try:
            page_text = driver.find_element(By.TAG_NAME, "body").text
            # Look for pattern like "Main Market : Diversified Industrials" or "Ace Market : Technology"
            sector_match = re.search(r"(?:Main Market|Ace Market|Leap Market)\s*:\s*([^\n]+)", page_text, re.IGNORECASE)
            if sector_match:
                sector_text = sector_match.group(1).strip()
                company_data["sector"] = sector_text
                print(f"  ✓ Extracted sector: {sector_text}")
        except:
            pass
        
        # Also try to extract from page text using regex
        try:
            page_text = driver.find_element(By.TAG_NAME, "body").text
            
            # Extract price
            if not company_data["price"]:
                price_match = re.search(r"Price[:\s]+([\d,]+\.?\d*)", page_text, re.IGNORECASE)
                if price_match:
                    company_data["price"] = _parse_float(price_match.group(1))
            
            # Extract PE ratio
            if not company_data["pe_ratio"]:
                pe_match = re.search(r"P/E[:\s]+([\d,]+\.?\d*)", page_text, re.IGNORECASE)
                if pe_match:
                    company_data["pe_ratio"] = _parse_float(pe_match.group(1))
            
            # Extract DY (Dividend Yield)
            if not company_data["dividend_yield"]:
                # Try exact "DY" match first
                dy_match = re.search(r"\bDY\b[:\s]+([\d,]+\.?\d*)", page_text, re.IGNORECASE)
                if dy_match:
                    company_data["dividend_yield"] = _parse_float(dy_match.group(1))
                    print(f"  ✓ Extracted dividend_yield from page text (DY): {company_data['dividend_yield']}")
                else:
                    # Try "Dividend Yield" pattern
                    dy_match = re.search(r"Dividend\s+Yield[:\s]+([\d,]+\.?\d*)", page_text, re.IGNORECASE)
                    if dy_match:
                        company_data["dividend_yield"] = _parse_float(dy_match.group(1))
                        print(f"  ✓ Extracted dividend_yield from page text (Dividend Yield): {company_data['dividend_yield']}")
            
            # Extract Market Cap
            if not company_data["market_cap"]:
                # Try various Market Cap patterns
                market_cap_patterns = [
                    r"Market\s+Cap[:\s]+([\d,]+\.?\d*\s*[BMK]?)",  # With B/M/K suffix
                    r"Market\s+Cap[:\s]+([\d,]+\.?\d*)",
                    r"\bMarket\s+Capitalisation[:\s]+([\d,]+\.?\d*)",
                ]
                for pattern in market_cap_patterns:
                    market_cap_match = re.search(pattern, page_text, re.IGNORECASE)
                    if market_cap_match:
                        market_cap_str = market_cap_match.group(1)
                        # Handle B (billions), M (millions), K (thousands) suffixes
                        # Convert everything to millions (M)
                        multiplier = 1
                        if 'B' in market_cap_str.upper():
                            multiplier = 1000  # B to M: multiply by 1000
                            market_cap_str = market_cap_str.upper().replace('B', '').strip()
                        elif 'M' in market_cap_str.upper():
                            multiplier = 1  # Already in M
                            market_cap_str = market_cap_str.upper().replace('M', '').strip()
                        elif 'K' in market_cap_str.upper():
                            multiplier = 0.001  # K to M: divide by 1000
                            market_cap_str = market_cap_str.upper().replace('K', '').strip()
                        
                        parsed_value = _parse_float(market_cap_str)
                        if parsed_value:
                            company_data["market_cap"] = parsed_value * multiplier
                            print(f"  ✓ Extracted market_cap from page text: {company_data['market_cap']} (in millions)")
                        break
            
            # Extract ROE
            if not company_data["roe"]:
                roe_match = re.search(r"ROE[:\s]+([\d,]+\.?\d*)", page_text, re.IGNORECASE)
                if roe_match:
                    company_data["roe"] = _parse_float(roe_match.group(1))
        except:
            pass
        
        print(f"  ✓ Extracted company data: {company_data.get('name')} ({company_data.get('code')})")
        return company_data
        
    except Exception as e:
        print(f"  ⚠ Error extracting company data from detail page: {str(e)}")
        return company_data


def _extract_company_from_selenium_row(row, company_name: str) -> Dict:
    """Extract company data from Selenium table row."""
    from selenium.webdriver.common.by import By
    cells = row.find_elements(By.TAG_NAME, "td")
    company_data = {
        "name": company_name,
        "code": "",
        "detail_url": None,
        "price": None,
        "eps": None,
        "pe_ratio": None,
        "dividend_yield": None,
        "roe": None,
        "market_cap": None,
        "sector": "unknown"
    }
    
    try:
        if len(cells) > 0:
            name_cell = cells[0]
            try:
                name_link = name_cell.find_element(By.TAG_NAME, "a")
                company_data["name"] = name_link.text.strip()
                detail_url = name_link.get_attribute("href")
                if detail_url and not detail_url.startswith("http"):
                    base_url = "https://www.klsescreener.com"
                    if detail_url.startswith("/"):
                        detail_url = base_url + detail_url
                    else:
                        detail_url = base_url + "/" + detail_url
                company_data["detail_url"] = detail_url
            except:
                company_data["name"] = name_cell.text.strip()
        
        if len(cells) > 1:
            company_data["code"] = cells[1].text.strip()
        
        if len(cells) > 3:
            company_data["price"] = _parse_float(cells[3].text.strip())
        if len(cells) > 8:
            company_data["eps"] = _parse_float(cells[8].text.strip())
        if len(cells) > 11:
            company_data["pe_ratio"] = _parse_float(cells[11].text.strip())
        if len(cells) > 12:
            company_data["dividend_yield"] = _parse_float(cells[12].text.strip())
        if len(cells) > 13:
            company_data["roe"] = _parse_float(cells[13].text.strip())
        if len(cells) > 15:
            company_data["market_cap"] = _parse_float(cells[15].text.strip())
    except Exception as e:
        print(f"  ⚠ Error extracting company data: {str(e)}")
    
    return company_data


def _extract_company_from_table_row(row, company_name: str) -> Dict:
    """
    Extract company data from a table row.
    
    Args:
        row: BeautifulSoup table row element
        company_name: Company name for reference
        
    Returns:
        Dictionary with company data
    """
    cells = row.find_all(["td", "th"])
    company_data = {
        "name": company_name,
        "code": "",
        "detail_url": None,
        "price": None,
        "eps": None,
        "pe_ratio": None,
        "dividend_yield": None,
        "roe": None,
        "market_cap": None,
        "sector": "unknown"
    }
    
    try:
        # Extract name and link (usually first cell)
        if len(cells) > 0:
            name_cell = cells[0]
            name_link = name_cell.find("a")
            if name_link:
                company_data["name"] = name_link.get_text(strip=True)
                detail_url = name_link.get("href", "")
                if detail_url and not detail_url.startswith("http"):
                    base_url = "https://www.klsescreener.com"
                    if detail_url.startswith("/"):
                        detail_url = base_url + detail_url
                    else:
                        detail_url = base_url + "/" + detail_url
                company_data["detail_url"] = detail_url
        
        # Extract code (usually second cell)
        if len(cells) > 1:
            company_data["code"] = cells[1].get_text(strip=True)
        
        # Extract price (usually 4th cell, index 3)
        if len(cells) > 3:
            company_data["price"] = _parse_float(cells[3].get_text(strip=True))
        
        # Extract other fields similar to existing parsing logic
        if len(cells) > 8:
            company_data["eps"] = _parse_float(cells[8].get_text(strip=True))
        if len(cells) > 11:
            company_data["pe_ratio"] = _parse_float(cells[11].get_text(strip=True))
        if len(cells) > 12:
            company_data["dividend_yield"] = _parse_float(cells[12].get_text(strip=True))
        if len(cells) > 13:
            company_data["roe"] = _parse_float(cells[13].get_text(strip=True))
        if len(cells) > 15:
            company_data["market_cap"] = _parse_float(cells[15].get_text(strip=True))
            
    except Exception as e:
        print(f"  ⚠ Error extracting company data: {str(e)}")
    
    return company_data


def _get_embeddings(text: str) -> Optional[List[float]]:
    """
    Get embeddings for text using Ollama.
    
    Args:
        text: Text to embed
        
    Returns:
        Embedding vector or None if failed
    """
    if not OLLAMA_AVAILABLE:
        return None
    
    try:
        # Use Ollama's embedding model (try to use same model as chat, fallback to available)
        available_model = _get_available_model("llama3.2")
        response = ollama.embeddings(model=available_model, prompt=text)
        return response['embedding']
    except Exception as e:
        print(f"  ⚠ Error getting embeddings: {str(e)}")
        return None


def _vector_search(query_text: str, webpage_text: str, top_k: int = 5) -> List[str]:
    """
    Perform vector search on webpage content.
    
    Args:
        query_text: Query text to search for
        webpage_text: Full webpage text content
        top_k: Number of top results to return
        
    Returns:
        List of relevant text chunks from webpage
    """
    if not NUMPY_AVAILABLE or not OLLAMA_AVAILABLE:
        # Fallback: simple keyword matching
        query_words = query_text.lower().split()
        sentences = webpage_text.split('.')
        relevant_sentences = []
        for sentence in sentences:
            sentence_lower = sentence.lower()
            score = sum(1 for word in query_words if word in sentence_lower)
            if score > 0:
                relevant_sentences.append((score, sentence.strip()))
        relevant_sentences.sort(reverse=True, key=lambda x: x[0])
        return [s[1] for s in relevant_sentences[:top_k]]
    
    try:
        # Get query embedding
        query_embedding = _get_embeddings(query_text)
        if not query_embedding:
            return []
        
        # Split webpage into chunks (sentences or paragraphs)
        chunks = [chunk.strip() for chunk in re.split(r'[.\n]+', webpage_text) if len(chunk.strip()) > 20]
        
        # Get embeddings for chunks
        chunk_embeddings = []
        for chunk in chunks[:50]:  # Limit to first 50 chunks for performance
            embedding = _get_embeddings(chunk)
            if embedding:
                chunk_embeddings.append((chunk, embedding))
        
        if not chunk_embeddings:
            return []
        
        # Calculate cosine similarity
        query_vec = np.array(query_embedding)
        similarities = []
        for chunk, embedding in chunk_embeddings:
            chunk_vec = np.array(embedding)
            similarity = np.dot(query_vec, chunk_vec) / (np.linalg.norm(query_vec) * np.linalg.norm(chunk_vec))
            similarities.append((similarity, chunk))
        
        # Sort by similarity and return top_k
        similarities.sort(reverse=True, key=lambda x: x[0])
        return [chunk for _, chunk in similarities[:top_k]]
        
    except Exception as e:
        print(f"  ⚠ Error in vector search: {str(e)}")
        return []


@log_agent_execution("company_query_agent")
def analyze_company_query(query: str) -> CompanyQueryResponse:
    """
    Extract company information from a natural language query.
    
    This agent:
    1. Extracts company name from the query using LLM
    2. Searches for the company on KLSE Screener
    3. Accesses the company detail page
    4. Extracts all company data and fills Company schema
    
    Args:
        query: Natural language query about a single company (e.g., "can I invest sunway now")
        
    Returns:
        CompanyQueryResponse with company data
        
    Note:
        Only handles single company queries. Sector queries are not supported.
    """
    agent_logger = AgentLogger("company_query_agent")
    agent_logger.log_agent_start({"query": query})
    
    print(f"[COMPANY_QUERY] Starting company extraction for query: '{query}'")
    
    try:
        # Step 1: Extract company name from query
        print(f"[COMPANY_QUERY.1] Extracting company name from query...")
        company_name = _extract_company_name_from_query(query)
        print(f"[COMPANY_QUERY.1] ✓ Extracted company name: '{company_name}'")
        
        # Step 2: Search for company on KLSE Screener and get company data
        print(f"[COMPANY_QUERY.2] Searching for '{company_name}' on KLSE Screener...")
        company_data = _search_company_on_klse(company_name)
        
        if not company_data:
            raise ValueError(f"Company '{company_name}' not found on KLSE Screener")
        
        print(f"[COMPANY_QUERY.2] ✓ Found company: {company_data.get('name', 'N/A')} ({company_data.get('code', 'N/A')})")
        
        # Step 2.1: If we have sector info, try to find company using sector/subsector filtering
        sector = company_data.get("sector", "unknown")
        if sector and sector != "unknown":
            print(f"[COMPANY_QUERY.2.1] Company sector: '{sector}'. Trying sector/subsector-based search...")
            sector_based_data = _search_company_by_sector(company_name, sector)
            if sector_based_data:
                # Use sector-based search result if it found the company
                print(f"[COMPANY_QUERY.2.1] ✓ Found company via sector/subsector filtering")
                company_data = sector_based_data
            else:
                print(f"[COMPANY_QUERY.2.1] ⚠ Company not found via sector/subsector filtering, using original search result")
        
        # Step 3: Extract average volume if detail_url is available
        sector = company_data.get("sector", "unknown")
        average_volume = company_data.get("average_volume")
        if company_data.get("detail_url") and not average_volume:
            print(f"[COMPANY_QUERY.3] Extracting average volume from detail page...")
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
                response = requests.get(company_data.get("detail_url"), headers=headers, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'lxml')
                    page_text = soup.get_text()
                    
                    # Extract Average Volume (3M)
                    volume_patterns = [
                        r"Average\s+Volume\s+\(3M\)[^\d]*([\d,]+\.?\d*)",
                        r"Avg\s+Volume\s+\(3M\)[^\d]*([\d,]+\.?\d*)",
                        r"Average\s+Volume[^\d]*([\d,]+\.?\d*)",
                    ]
                    
                    for pattern in volume_patterns:
                        match = re.search(pattern, page_text, re.IGNORECASE)
                        if match:
                            try:
                                average_volume = _parse_float(match.group(1))
                                print(f"[COMPANY_QUERY.3] ✓ Found Average Volume (3M): {average_volume}")
                                break
                            except ValueError:
                                continue
            except Exception as e:
                print(f"[COMPANY_QUERY.3] ⚠ Error extracting average volume: {str(e)}")
        
        # Step 5: Create Company object with all extracted data
        company = Company(
            name=company_data.get("name", company_name),
            code=company_data.get("code", ""),
            detail_url=company_data.get("detail_url"),
            price=company_data.get("price"),
            eps=company_data.get("eps"),
            pe_ratio=company_data.get("pe_ratio"),
            dividend_yield=company_data.get("dividend_yield"),
            roe=company_data.get("roe"),
            market_cap=company_data.get("market_cap"),
            sector=sector,
            average_volume=average_volume,
            watchlist=False
        )
        
        print(f"[COMPANY_QUERY] ✓ Company data extracted successfully")
        
        # Return simplified response (no LLM analysis)
        return CompanyQueryResponse(
            query=query,
            extracted_company_name=company_name,
            company=company,
            analysis="Company data extracted successfully.",
            recommendation="not suggested",  # Default recommendation
            confidence=None,
            reasoning=None
        )
        
    except Exception as e:
        error_msg = f"Error processing company query: {str(e)}"
        print(f"[COMPANY_QUERY] ⚠ {error_msg}")
        agent_logger.error(str(e))
        
        # Return error response
        return CompanyQueryResponse(
            query=query,
            extracted_company_name="",
            company=None,
            analysis=f"Error: {error_msg}",
            recommendation="not suggested",
            confidence=0.0,
            reasoning="Could not extract company data"
        )


@log_agent_execution("klse_sector_agent")
def get_klse_sector_companies(sector: str) -> SectorCompanies:
    """
    Fetch all companies in a specific sector from KLSE Screener.
    
    This agent navigates to https://www.klsescreener.com/v2/ and filters
    companies by the specified sector, then extracts and returns all
    company information.
    
    Args:
        sector: Sector name (e.g., "technology", "finance", "healthcare")
        
    Returns:
        SectorCompanies object containing list of companies in the sector
        
    Raises:
        ValueError: If sector is not recognized
        Exception: If web scraping fails
    """
    agent_logger = AgentLogger("klse_sector_agent")
    agent_logger.log_agent_start({"sector": sector})
    
    print(f"[STEP 1] Starting KLSE Screener agent for sector: {sector}")
    
    # Map user-friendly sector name to KLSE Screener sector name
    print(f"[STEP 2] Mapping sector name...")
    klse_sector = SECTOR_MAPPING.get(sector.lower())
    if not klse_sector:
        error_msg = f"Unknown sector: {sector}. Available sectors: {list(SECTOR_MAPPING.keys())}"
        print(f"[ERROR] {error_msg}")
        agent_logger.error("Sector mapping failed", input_data={"sector": sector})
        raise ValueError(error_msg)
    
    print(f"[STEP 2] ✓ Sector mapped: '{sector}' → '{klse_sector}'")
    agent_logger.info("Sector mapped", input_data={"sector": sector, "klse_sector": klse_sector})
    
    try:
        # KLSE Screener base URL
        base_url = "https://www.klsescreener.com/v2/"
        print(f"[STEP 3] Base URL: {base_url}")
        
        # Try to fetch data using requests first (faster if data is available)
        print(f"[STEP 4] Attempting to fetch via API/HTML parsing...")
        companies = _fetch_companies_via_api(base_url, klse_sector, sector)
        
        if not companies:
            # Fallback: Use Selenium for JavaScript-rendered content
            print(f"[STEP 5] API/HTML method returned no results. Switching to Selenium...")
            print(f"[STEP 5.1] Note: Selenium requires ChromeDriver. If it fails, check ChromeDriver installation.")
            logger.info("Attempting to fetch via Selenium...")
            try:
                companies = _fetch_companies_via_selenium(base_url, klse_sector, sector)
                if companies:
                    print(f"[STEP 5.2] ✓ Successfully fetched {len(companies)} companies via Selenium")
                else:
                    print(f"[STEP 5.2] ✗ Selenium method also returned 0 companies")
            except Exception as e:
                print(f"[STEP 5.2] ✗ Selenium failed: {str(e)}")
                print(f"[STEP 5.3] Falling back to empty result. Check ChromeDriver or website structure.")
                companies = []
        else:
            print(f"[STEP 5] ✓ Successfully fetched {len(companies)} companies via API/HTML")
        
        # Filter companies by Average Volume (3M) >= 100,000
        print(f"[STEP 6] Filtering companies by Average Volume (3M) >= 100,000...")
        companies = filter_companies_by_volume(companies, min_volume=100000)
        print(f"[STEP 6.1] ✓ After volume filtering: {len(companies)} companies remaining")
        
        # Analyze companies based on RSI(14) and Stochastic(14)
        print(f"[STEP 7] Analyzing companies based on RSI(14) and Stochastic(14)...")
        companies = analyze_companies_rsi_stochastic(companies)
        print(f"[STEP 7.1] ✓ After RSI/Stochastic analysis: {len(companies)} companies analyzed")
        
        print(f"[STEP 8] Preparing response with {len(companies)} companies...")
        result = SectorCompanies(
            sector=sector,
            companies=companies,
            total_count=len(companies)
        )
        print(f"[STEP 9] ✓ Complete! Returning {result.total_count} companies for sector '{sector}'")
        
        agent_logger.log_agent_end(
            input_data={"sector": sector, "klse_sector": klse_sector},
            output_data={"total_count": result.total_count, "sector": result.sector}
        )
        
        return result
        
    except Exception as e:
        error_msg = f"Error fetching companies for sector {sector}: {str(e)}"
        print(f"[ERROR] {error_msg}")
        agent_logger.error(
            "Failed to fetch companies",
            input_data={"sector": sector, "klse_sector": klse_sector},
            metadata={"error": str(e)}
        )
        # Return empty result instead of failing completely
        return SectorCompanies(
            sector=sector,
            companies=[],
            total_count=0
        )


def _fetch_companies_via_api(base_url: str, klse_sector: str, sector: str) -> List[Company]:
    """
    Attempt to fetch companies via API or static HTML parsing.
    
    Args:
        base_url: Base URL of KLSE Screener
        klse_sector: KLSE Screener sector name
        sector: Original sector name
        
    Returns:
        List of Company objects
    """
    companies = []
    
    try:
        # Try different URL patterns for sector filtering
        # Pattern 1: URL parameter
        filtered_url = f"{base_url}?sector={klse_sector.replace(' ', '%20')}"
        print(f"  [4.1] Preparing HTTP request with sector filter...")
        print(f"  [4.1.1] Trying URL: {filtered_url}")
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
        
        print(f"  [4.2] Sending GET request with sector filter...")
        # Try filtered URL first
        response = requests.get(
            filtered_url,
            headers=headers,
            timeout=10
        )
        
        # If filtered URL doesn't work, try base URL and we'll filter in Selenium
        if response.status_code != 200 or len(response.content) < 1000:
            print(f"  [4.2.1] Filtered URL didn't work, trying base URL...")
            response = requests.get(
                base_url,
                headers=headers,
                timeout=10
            )
        
        print(f"  [4.3] Response status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"  [4.4] Parsing HTML content...")
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Debug: Check if page contains sector-related content
            page_text = soup.get_text().lower()
            if klse_sector.lower() in page_text or sector.lower() in page_text:
                print(f"  [4.4.1] ✓ Page contains sector-related content")
            else:
                print(f"  [4.4.1] ⚠ Page may not be filtered by sector")
            
            # Parse HTML to extract company data
            # This is a placeholder - actual parsing logic depends on KLSE Screener's HTML structure
            print(f"  [4.5] Extracting company data from HTML...")
            companies = _parse_company_table(soup, klse_sector)
            print(f"  [4.6] Extracted {len(companies)} companies from HTML")
            
            # If no companies found, try to find any table structure for debugging
            if len(companies) == 0:
                print(f"  [4.6.1] No companies found. Checking page structure...")
                all_tables = soup.find_all("table")
                print(f"  [4.6.2] Found {len(all_tables)} table(s) on page")
                for idx, table in enumerate(all_tables[:3]):  # Check first 3 tables
                    rows = table.find_all("tr")
                    print(f"  [4.6.3] Table {idx+1}: {len(rows)} rows")
        else:
            print(f"  [4.4] ✗ Request failed with status {response.status_code}")
            
    except Exception as e:
        error_msg = f"API/HTML fetch failed: {str(e)}"
        print(f"  [4.ERROR] {error_msg}")
        logger.warning(error_msg)
    
    return companies


def _fetch_companies_via_selenium(base_url: str, klse_sector: str, sector: str) -> List[Company]:
    """
    Fetch companies using Selenium for JavaScript-rendered content.
    
    Args:
        base_url: Base URL of KLSE Screener
        klse_sector: KLSE Screener sector name
        sector: Original sector name
        
    Returns:
        List of Company objects
    """
    try:
        print(f"  [5.1] Importing Selenium modules...")
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        
        print(f"  [5.2] Configuring Chrome options (headless mode)...")
        # Configure Chrome options for headless mode
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        
        print(f"  [5.3] Initializing Chrome WebDriver...")
        # Initialize driver (requires chromedriver to be installed)
        try:
            # Try with service to handle ChromeDriver path issues
            try:
                from selenium.webdriver.chrome.service import Service
                service = Service()  # Will use system PATH
                driver = webdriver.Chrome(service=service, options=chrome_options)
            except:
                # Fallback to direct initialization
                driver = webdriver.Chrome(options=chrome_options)
            print(f"  [5.4] ✓ WebDriver initialized successfully")
        except Exception as e:
            error_msg = f"Failed to initialize ChromeDriver: {str(e)}"
            print(f"  [5.ERROR] {error_msg}")
            print(f"  [5.ERROR] ChromeDriver compatibility issue detected.")
            print(f"  [5.ERROR] Solutions:")
            print(f"  [5.ERROR]   1. Check Chrome version: chrome://version")
            print(f"  [5.ERROR]   2. Install matching ChromeDriver: brew install chromedriver")
            print(f"  [5.ERROR]   3. Or use: chromedriver --version to check installed version")
            print(f"  [5.ERROR]   4. Try: brew upgrade chromedriver")
            raise Exception(error_msg)
        
        try:
            print(f"  [5.5] Navigating to {base_url}...")
            # Navigate to KLSE Screener
            driver.get(base_url)
            print(f"  [5.6] Waiting for page to load (2 seconds)...")
            time.sleep(2)  # Wait for page to load
            print(f"  [5.7] ✓ Page loaded")
            
            # Find and select sector filter
            # Note: These selectors need to be adjusted based on actual KLSE Screener structure
            try:
                print(f"  [5.8] Looking for sector filter element...")
                # Based on page structure, sector dropdown has name="sector"
                print(f"  [5.8.1] Using selector: name='sector'")
                sector_filter = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.NAME, "sector"))
                )
                print(f"  [5.9] ✓ Sector filter found using: name='sector'")
                
                # List all available sector options for debugging
                from selenium.webdriver.support.ui import Select
                select_temp = Select(sector_filter)
                print(f"  [5.9.1] Available sector options ({len(select_temp.options)} total):")
                for idx, option in enumerate(select_temp.options[:10]):  # Show first 10
                    print(f"    - Option {idx+1}: '{option.text}'")
                
                print(f"  [5.10] Selecting sector: '{klse_sector}'...")
                # Use Selenium Select class to interact with dropdown
                select = Select(sector_filter)
                
                # Try to select by visible text first
                selected = False
                try:
                    print(f"  [5.10.1] Attempting to select by exact match: '{klse_sector}'")
                    select.select_by_visible_text(klse_sector)
                    print(f"  [5.10.2] ✓ Selected by exact match")
                    selected = True
                except:
                    print(f"  [5.10.2] ✗ Exact match failed, trying case-insensitive match...")
                    # Try case-insensitive match
                    try:
                        options = select.options
                        for option in options:
                            if option.text.strip().lower() == klse_sector.lower():
                                print(f"  [5.10.3] Found case-insensitive match: '{option.text}'")
                                select.select_by_visible_text(option.text)
                                print(f"  [5.10.4] ✓ Selected by case-insensitive match")
                                selected = True
                                break
                    except:
                        pass
                
                if not selected:
                    # Try partial text match
                    try:
                        print(f"  [5.10.5] Trying partial text match...")
                        options = select.options
                        for option in options:
                            option_text = option.text.strip().lower()
                            klse_lower = klse_sector.lower()
                            # Check if either contains the other
                            if (klse_lower in option_text or option_text in klse_lower) and option_text:
                                print(f"  [5.10.6] Found partial match: '{option.text}' (searching for '{klse_sector}')")
                                select.select_by_visible_text(option.text)
                                print(f"  [5.10.7] ✓ Selected by partial match")
                                selected = True
                                break
                        
                        if not selected:
                            raise Exception(f"Could not find sector option matching '{klse_sector}'")
                    except Exception as e:
                        print(f"  [5.10.8] ✗ Selection failed: {str(e)}")
                        # List all available options for debugging
                        print(f"  [5.10.9] Available options in dropdown ({len(select.options)} total):")
                        options = select.options
                        for idx, option in enumerate(options):
                            if option.text.strip():  # Skip empty options
                                print(f"    - Option {idx+1}: '{option.text}'")
                        raise
                
                # Wait a moment for the selection to register
                print(f"  [5.11] Waiting for sector selection to register...")
                time.sleep(1)
                
                # Define filter values (fixed values, no longer style-based)
                filters = {
                    "pe_max": "20",
                    "market_cap": "200",
                    "roe_min": "12"
                }
                print(f"  [5.11.0] Using filter values: {filters}")
                
                # Fill in Market Cap (M) field
                print(f"  [5.11.1] Looking for Market Cap (M) input field...")
                market_cap_input = None
                market_cap_selectors = [
                    (By.NAME, "market_cap"),
                    (By.ID, "market_cap"),
                    (By.XPATH, "//input[contains(@placeholder, 'Market Cap') or contains(@name, 'market') or contains(@id, 'market')]"),
                    (By.XPATH, "//input[@type='text' or @type='number']"),  # Fallback: find any text/number input
                ]
                
                for selector_type, selector_value in market_cap_selectors:
                    try:
                        print(f"  [5.11.2] Trying Market Cap selector: {selector_type} = '{selector_value}'")
                        inputs = driver.find_elements(selector_type, selector_value)
                        # If we get multiple inputs, try to find the one that looks like Market Cap
                        for inp in inputs:
                            inp_name = inp.get_attribute("name") or ""
                            inp_id = inp.get_attribute("id") or ""
                            inp_placeholder = inp.get_attribute("placeholder") or ""
                            # Check if it's likely the Market Cap field
                            if any(term in (inp_name + inp_id + inp_placeholder).lower() for term in ["market", "cap", "mcap"]):
                                market_cap_input = inp
                                print(f"  [5.11.3] ✓ Found Market Cap input using: {selector_type} = '{selector_value}'")
                                break
                        if market_cap_input:
                            break
                    except Exception as e:
                        continue
                
                # If not found with specific selectors, try finding by label text
                if not market_cap_input:
                    try:
                        print(f"  [5.11.4] Trying to find Market Cap by label text...")
                        # Look for label containing "Market Cap" and find associated input
                        labels = driver.find_elements(By.XPATH, "//label[contains(text(), 'Market Cap')]")
                        for label in labels:
                            label_for = label.get_attribute("for")
                            if label_for:
                                market_cap_input = driver.find_element(By.ID, label_for)
                                print(f"  [5.11.5] ✓ Found Market Cap input via label (for='{label_for}')")
                                break
                            # If no 'for' attribute, try finding input nearby
                            parent = label.find_element(By.XPATH, "./..")
                            market_cap_input = parent.find_element(By.TAG_NAME, "input")
                            if market_cap_input:
                                print(f"  [5.11.6] ✓ Found Market Cap input near label")
                                break
                    except:
                        pass
                
                if market_cap_input:
                    try:
                        print(f"  [5.11.7] Clearing Market Cap field...")
                        market_cap_input.clear()
                        print(f"  [5.11.8] Entering '{filters['market_cap']}' in Market Cap (M) field...")
                        market_cap_input.send_keys(filters['market_cap'])
                        print(f"  [5.11.9] ✓ Market Cap (M) field filled with '{filters['market_cap']}'")
                        time.sleep(0.5)  # Brief wait for value to register
                    except Exception as e:
                        print(f"  [5.11.10] ⚠ Failed to fill Market Cap field: {str(e)}")
                else:
                    print(f"  [5.11.11] ⚠ Market Cap (M) input field not found, continuing without setting it...")
                
                # Fill in PE max field (second box in PE row) with 20
                print(f"  [5.11.12] Looking for PE (Price-to-Earnings) max input field (second box in PE row)...")
                pe_max_input = None
                
                # Strategy 1: Find PE row/container and get the second input (max)
                try:
                    print(f"  [5.11.13] Trying to find PE row/container...")
                    # Look for label or text containing "PE" or "P/E"
                    pe_labels = driver.find_elements(By.XPATH, "//label[contains(text(), 'PE') or contains(text(), 'P/E')]")
                    pe_texts = driver.find_elements(By.XPATH, "//*[contains(text(), 'PE') or contains(text(), 'P/E')]")
                    
                    for pe_element in list(pe_labels) + list(pe_texts):
                        try:
                            # Get the parent container (form-group, row, or similar)
                            parent = pe_element.find_element(By.XPATH, "./ancestor::*[contains(@class, 'form') or contains(@class, 'row') or contains(@class, 'group') or contains(@class, 'field')][1]")
                            # Find all input elements in this container
                            inputs = parent.find_elements(By.TAG_NAME, "input")
                            text_inputs = [inp for inp in inputs if inp.get_attribute("type") in ["text", "number", None] or inp.get_attribute("type") == ""]
                            
                            if len(text_inputs) >= 2:
                                # Second input should be the max field
                                pe_max_input = text_inputs[1]  # Index 1 is the second input
                                print(f"  [5.11.14] ✓ Found PE max input (second input in PE row) via PE element")
                                # Verify it's likely the max field
                                inp_name = pe_max_input.get_attribute("name") or ""
                                inp_id = pe_max_input.get_attribute("id") or ""
                                if "max" in (inp_name + inp_id).lower():
                                    print(f"  [5.11.15] ✓ Confirmed: PE max field (name='{inp_name}', id='{inp_id}')")
                                    break
                        except:
                            continue
                    
                    # Strategy 2: If not found, try direct selectors for PE max
                    if not pe_max_input:
                        print(f"  [5.11.16] Trying direct selectors for PE max field...")
                        pe_max_selectors = [
                            (By.NAME, "pe_max"),
                            (By.ID, "pe_max"),
                            (By.NAME, "pe[max]"),
                            (By.ID, "pe[max]"),
                            (By.XPATH, "//input[contains(@name, 'pe') and contains(@name, 'max')]"),
                            (By.XPATH, "//input[contains(@id, 'pe') and contains(@id, 'max')]"),
                        ]
                        
                        for selector_type, selector_value in pe_max_selectors:
                            try:
                                inputs = driver.find_elements(selector_type, selector_value)
                                if inputs:
                                    pe_max_input = inputs[0]
                                    print(f"  [5.11.17] ✓ Found PE max input using: {selector_type} = '{selector_value}'")
                                    break
                            except:
                                continue
                    
                    # Strategy 3: Find all inputs with "pe" in name/id and identify max by position
                    if not pe_max_input:
                        try:
                            print(f"  [5.11.18] Trying alternative: finding all PE-related inputs...")
                            all_inputs = driver.find_elements(By.TAG_NAME, "input")
                            pe_inputs = []
                            for inp in all_inputs:
                                inp_name = inp.get_attribute("name") or ""
                                inp_id = inp.get_attribute("id") or ""
                                inp_type = inp.get_attribute("type") or ""
                                if inp_type in ["text", "number", None, ""] and "pe" in (inp_name + inp_id).lower():
                                    pe_inputs.append(inp)
                            
                            if len(pe_inputs) >= 2:
                                # Second one should be max
                                pe_max_input = pe_inputs[1]
                                print(f"  [5.11.19] ✓ Found PE max input (second PE input found)")
                        except:
                            pass
                    
                except Exception as e:
                    print(f"  [5.11.20] ⚠ Error searching for PE max field: {str(e)}")
                
                if pe_max_input:
                    try:
                        print(f"  [5.11.21] Clearing PE max field...")
                        pe_max_input.clear()
                        print(f"  [5.11.22] Entering '{filters['pe_max']}' in PE max field...")
                        pe_max_input.send_keys(filters['pe_max'])
                        print(f"  [5.11.23] ✓ PE max field filled with '{filters['pe_max']}'")
                        time.sleep(0.5)  # Brief wait for value to register
                    except Exception as e:
                        print(f"  [5.11.24] ⚠ Failed to fill PE max field: {str(e)}")
                else:
                    print(f"  [5.11.25] ⚠ PE max input field not found, continuing without setting it...")
                
                # Fill in ROE min field (first box in ROE row) with 12
                print(f"  [5.11.26] Looking for ROE (Return on Equity) min input field (first box in ROE row)...")
                roe_min_input = None
                
                # Strategy 1: Find ROE row/container and get the first input (min)
                try:
                    print(f"  [5.11.27] Trying to find ROE row/container...")
                    # Look for label or text containing "ROE"
                    roe_labels = driver.find_elements(By.XPATH, "//label[contains(text(), 'ROE')]")
                    roe_texts = driver.find_elements(By.XPATH, "//*[contains(text(), 'ROE')]")
                    
                    for roe_element in list(roe_labels) + list(roe_texts):
                        try:
                            # Get the parent container (form-group, row, or similar)
                            parent = roe_element.find_element(By.XPATH, "./ancestor::*[contains(@class, 'form') or contains(@class, 'row') or contains(@class, 'group') or contains(@class, 'field')][1]")
                            # Find all input elements in this container
                            inputs = parent.find_elements(By.TAG_NAME, "input")
                            text_inputs = [inp for inp in inputs if inp.get_attribute("type") in ["text", "number", None] or inp.get_attribute("type") == ""]
                            
                            if len(text_inputs) >= 1:
                                # First input should be the min field
                                roe_min_input = text_inputs[0]  # Index 0 is the first input
                                print(f"  [5.11.28] ✓ Found ROE min input (first input in ROE row) via ROE element")
                                # Verify it's likely the min field
                                inp_name = roe_min_input.get_attribute("name") or ""
                                inp_id = roe_min_input.get_attribute("id") or ""
                                if "min" in (inp_name + inp_id).lower() or len(text_inputs) >= 1:
                                    print(f"  [5.11.29] ✓ Confirmed: ROE min field (name='{inp_name}', id='{inp_id}')")
                                    break
                        except:
                            continue
                    
                    # Strategy 2: If not found, try direct selectors for ROE min
                    if not roe_min_input:
                        print(f"  [5.11.30] Trying direct selectors for ROE min field...")
                        roe_min_selectors = [
                            (By.NAME, "roe_min"),
                            (By.ID, "roe_min"),
                            (By.NAME, "roe[min]"),
                            (By.ID, "roe[min]"),
                            (By.XPATH, "//input[contains(@name, 'roe') and contains(@name, 'min')]"),
                            (By.XPATH, "//input[contains(@id, 'roe') and contains(@id, 'min')]"),
                        ]
                        
                        for selector_type, selector_value in roe_min_selectors:
                            try:
                                inputs = driver.find_elements(selector_type, selector_value)
                                if inputs:
                                    roe_min_input = inputs[0]
                                    print(f"  [5.11.31] ✓ Found ROE min input using: {selector_type} = '{selector_value}'")
                                    break
                            except:
                                continue
                    
                    # Strategy 3: Find all inputs with "roe" in name/id and identify min by position
                    if not roe_min_input:
                        try:
                            print(f"  [5.11.32] Trying alternative: finding all ROE-related inputs...")
                            all_inputs = driver.find_elements(By.TAG_NAME, "input")
                            roe_inputs = []
                            for inp in all_inputs:
                                inp_name = inp.get_attribute("name") or ""
                                inp_id = inp.get_attribute("id") or ""
                                inp_type = inp.get_attribute("type") or ""
                                if inp_type in ["text", "number", None, ""] and "roe" in (inp_name + inp_id).lower():
                                    roe_inputs.append(inp)
                            
                            if len(roe_inputs) >= 1:
                                # First one should be min
                                roe_min_input = roe_inputs[0]
                                print(f"  [5.11.33] ✓ Found ROE min input (first ROE input found)")
                        except:
                            pass
                    
                except Exception as e:
                    print(f"  [5.11.34] ⚠ Error searching for ROE min field: {str(e)}")
                
                if roe_min_input:
                    try:
                        print(f"  [5.11.35] Clearing ROE min field...")
                        roe_min_input.clear()
                        print(f"  [5.11.36] Entering '{filters['roe_min']}' in ROE min field...")
                        roe_min_input.send_keys(filters['roe_min'])
                        print(f"  [5.11.37] ✓ ROE min field filled with '{filters['roe_min']}'")
                        time.sleep(0.5)  # Brief wait for value to register
                    except Exception as e:
                        print(f"  [5.11.38] ⚠ Failed to fill ROE min field: {str(e)}")
                else:
                    print(f"  [5.11.39] ⚠ ROE min input field not found, continuing without setting it...")
                
                # Look for and click the "Screen" button to apply the filter
                print(f"  [5.12] Looking for 'Screen' button to apply filter...")
                screen_button = None
                # Use the known working selector first, with fallbacks
                button_selectors = [
                    (By.XPATH, "//input[@type='submit' and contains(@value, 'Screen')]"),  # Known working selector
                    (By.XPATH, "//input[@type='button' and contains(@value, 'Screen')]"),  # Fallback
                    (By.XPATH, "//button[contains(text(), 'Screen')]"),  # Fallback for button element
                ]
                
                for selector_type, selector_value in button_selectors:
                    try:
                        print(f"  [5.12.1] Trying button selector: {selector_type} = '{selector_value}'")
                        screen_button = WebDriverWait(driver, 3).until(
                            EC.element_to_be_clickable((selector_type, selector_value))
                        )
                        print(f"  [5.12.2] ✓ Found Screen button using: {selector_type} = '{selector_value}'")
                        break
                    except:
                        continue
                
                if not screen_button:
                    # Last resort: search all input elements
                    print(f"  [5.12.3] Standard selectors didn't work, searching all input elements...")
                    all_inputs = driver.find_elements(By.TAG_NAME, "input")
                    print(f"  [5.12.4] Found {len(all_inputs)} input element(s) on page")
                    for idx, inp in enumerate(all_inputs):
                        try:
                            inp_value = inp.get_attribute("value") or ""
                            inp_type = inp.get_attribute("type") or ""
                            inp_id = inp.get_attribute("id") or ""
                            if "screen" in inp_value.lower():
                                screen_button = inp
                                print(f"  [5.12.5] ✓ Found Screen button: type='{inp_type}', value='{inp_value}'")
                                break
                        except:
                            pass
                
                if screen_button:
                    print(f"  [5.13] Clicking Screen button...")
                    screen_button.click()
                    print(f"  [5.13.1] ✓ Screen button clicked")
                    print(f"  [5.13.2] Waiting for table to load after clicking Screen button...")
                    time.sleep(3)  # Wait for table to load
                else:
                    print(f"  [5.13] ⚠ Screen button not found, but continuing...")
                    print(f"  [5.13.1] Waiting for table to load anyway...")
                    time.sleep(2)
                
                print(f"  [5.14] ✓ Results should be loaded")
                
                # Wait for table to appear (it's loaded dynamically via JavaScript after clicking Screen)
                print(f"  [5.15] Waiting for company table to load after Screen button click...")
                try:
                    # Wait for table to appear - try common table selectors
                    table_selectors = [
                        (By.TAG_NAME, "table"),
                        (By.CSS_SELECTOR, "table.table"),
                        (By.CSS_SELECTOR, "table tbody"),
                        (By.XPATH, "//table[.//tr]"),
                        (By.CSS_SELECTOR, "table tbody tr"),
                    ]
                    table_found = False
                    for selector_type, selector_value in table_selectors:
                        try:
                            WebDriverWait(driver, 15).until(
                                EC.presence_of_element_located((selector_type, selector_value))
                            )
                            # Also check if table has rows (not just empty table)
                            if selector_type == By.CSS_SELECTOR and "tr" in selector_value:
                                rows = driver.find_elements(By.CSS_SELECTOR, selector_value)
                                if len(rows) > 0:
                                    print(f"  [5.15.1] ✓ Table found with {len(rows)} rows using: {selector_type} = '{selector_value}'")
                                    table_found = True
                                    break
                            else:
                                print(f"  [5.15.1] ✓ Table found using: {selector_type} = '{selector_value}'")
                                table_found = True
                                break
                        except:
                            continue
                    
                    if not table_found:
                        print(f"  [5.15.1] ⚠ No table found, but continuing anyway...")
                    
                    # Additional wait for table content to populate
                    print(f"  [5.15.2] Waiting additional 2 seconds for table content to populate...")
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"  [5.15.1] ⚠ Error waiting for table: {str(e)}, continuing anyway...")
                
                print(f"  [5.16] Extracting company data from table...")
                print(f"  [5.16.1] Using sector parameter: '{sector}' (klse_sector: '{klse_sector}')")
                # Extract company data from the table - pass the original sector input
                companies = _extract_companies_from_table(driver, sector)
                print(f"  [5.17] ✓ Extracted {len(companies)} companies from table")
                
            except Exception as e:
                error_msg = f"Error interacting with KLSE Screener: {str(e)}"
                print(f"  [5.ERROR] {error_msg}")
                print(f"  [5.ERROR] Error type: {type(e).__name__}")
                print(f"  [5.ERROR] This might be a ChromeDriver compatibility issue.")
                print(f"  [5.ERROR] Try: brew upgrade chromedriver or download matching version")
                logger.error(error_msg, exc_info=True)
                companies = []
                
        finally:
            print(f"  [5.15] Closing WebDriver...")
            driver.quit()
            print(f"  [5.16] ✓ WebDriver closed")
            
        return companies
        
    except ImportError:
        error_msg = "Selenium not available, falling back to basic scraping"
        print(f"  [5.ERROR] {error_msg}")
        logger.warning(error_msg)
        return []
    except Exception as e:
        error_msg = f"Selenium fetch failed: {str(e)}"
        print(f"  [5.ERROR] {error_msg}")
        logger.error(error_msg)
        return []


def _parse_company_table(soup: BeautifulSoup, sector: str) -> List[Company]:
    """
    Parse company data from HTML table.
    
    Args:
        soup: BeautifulSoup object of the page
        sector: Sector name
        
    Returns:
        List of Company objects
    """
    companies = []
    
    try:
        print(f"    [4.5.1] Searching for company table in HTML...")
        # Find the stocks table - adjust selector based on actual KLSE Screener structure
        table = soup.find("table", {"class": "stocks-table"}) or soup.find("table", {"id": "stocks-table"})
        
        if table:
            print(f"    [4.5.2] ✓ Table found, extracting rows...")
            all_rows = table.find_all("tr")
            print(f"    [4.5.2.1] Total rows found: {len(all_rows)}")
            
            # Skip header row - check if first row has th elements (header)
            start_idx = 1 if all_rows and all_rows[0].find("th") else 0
            rows = all_rows[start_idx:]
            print(f"    [4.5.3] Found {len(rows)} company rows to process (skipped {start_idx} header row(s))")
            
            # Debug: Check first data row structure
            if rows:
                first_row_cells = rows[0].find_all(["td", "th"])
                print(f"    [4.5.3.1] First row has {len(first_row_cells)} cells")
                for idx, cell in enumerate(first_row_cells[:4]):
                    print(f"    [4.5.3.2] Cell {idx}: '{cell.get_text(strip=True)}'")
            
            for idx, row in enumerate(rows, 1):
                cells = row.find_all("td")
                if len(cells) >= 2:
                    try:
                        # Table structure: name (col 1), code (col 2), price (col 4), ..., eps (col 9), ..., pe (col 12), dy (col 13), roe (col 14), ..., mcap (col 16)
                        # Extract name and check if it's a link
                        name_cell = cells[0]
                        name_link = name_cell.find("a")
                        if name_link:
                            name = name_link.get_text(strip=True)
                            detail_url = name_link.get("href", "")
                            # Make URL absolute if it's relative
                            if detail_url and not detail_url.startswith("http"):
                                base_url = "https://www.klsescreener.com"
                                if detail_url.startswith("/"):
                                    detail_url = base_url + detail_url
                                else:
                                    detail_url = base_url + "/" + detail_url
                        else:
                            name = name_cell.get_text(strip=True)
                            detail_url = None
                        
                        # Remove [s] suffix from stock names (e.g., "BURSA [s]" -> "BURSA")
                        name = name.replace(" [s]", "").replace("[s]", "").strip()
                        code = cells[1].get_text(strip=True)
                        price = _parse_float(cells[3].get_text(strip=True)) if len(cells) > 3 else None
                        eps = _parse_float(cells[8].get_text(strip=True)) if len(cells) > 8 else None
                        pe_ratio = _parse_float(cells[11].get_text(strip=True)) if len(cells) > 11 else None
                        dividend_yield = _parse_float(cells[12].get_text(strip=True)) if len(cells) > 12 else None
                        roe = _parse_float(cells[13].get_text(strip=True)) if len(cells) > 13 else None
                        market_cap = _parse_float(cells[15].get_text(strip=True)) if len(cells) > 15 else None
                        
                        # Debug first company to verify structure
                        if idx == 1:
                            print(f"    [4.5.3.3] First company - name: '{name}', code: '{code}', detail_url: '{detail_url}', price: {price}, eps: {eps}, pe: {pe_ratio}, dy: {dividend_yield}, roe: {roe}, mcap: {market_cap}")
                        
                        company = Company(
                            name=name,
                            code=code,
                            detail_url=detail_url,
                            price=price,
                            eps=eps,
                            pe_ratio=pe_ratio,
                            dividend_yield=dividend_yield,
                            roe=roe,
                            market_cap=market_cap,
                            sector=sector  # Use the sector parameter passed to function
                        )
                        companies.append(company)
                        if idx % 10 == 0:  # Log every 10 companies
                            print(f"    [4.5.4] Processed {idx}/{len(rows)} companies...")
                    except Exception as e:
                        logger.warning(f"Error parsing company row {idx}: {str(e)}")
                        continue
            print(f"    [4.5.5] ✓ Successfully parsed {len(companies)} companies")
        else:
            print(f"    [4.5.2] ✗ No company table found in HTML")
                        
    except Exception as e:
        error_msg = f"Error parsing company table: {str(e)}"
        print(f"    [4.5.ERROR] {error_msg}")
        logger.warning(error_msg)
    
    return companies


def _extract_companies_from_table(driver, sector: str) -> List[Company]:
    """
    Extract company data from Selenium driver page.
    
    Args:
        driver: Selenium WebDriver instance
        sector: Sector name
        
    Returns:
        List of Company objects
    """
    companies = []
    
    try:
        from selenium.webdriver.common.by import By
        
        print(f"      [5.14.1] Searching for company table rows...")
        # Find table rows - try multiple selectors since table structure may vary
        rows = []
        row_selectors = [
            "table tbody tr",
            "table tr",
            "tbody tr",
            ".table tbody tr",
        ]
        
        for selector in row_selectors:
            try:
                rows = driver.find_elements(By.CSS_SELECTOR, selector)
                if len(rows) > 0:
                    print(f"      [5.14.2] Found {len(rows)} rows using selector: '{selector}'")
                    break
            except:
                continue
        
        if len(rows) == 0:
            print(f"      [5.14.2] ⚠ No rows found with any selector")
            return companies
        
        # Skip header row if present
        if rows:
            first_row_cells = rows[0].find_elements(By.TAG_NAME, "td")
            # Check if first row looks like a header (has th elements or specific text)
            try:
                first_row_th = rows[0].find_elements(By.TAG_NAME, "th")
                if first_row_th:
                    print(f"      [5.14.2.1] Skipping header row with {len(first_row_th)} th elements")
                    rows = rows[1:]
            except:
                pass
        
        for idx, row in enumerate(rows, 1):
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) >= 2:
                    # Table structure: name (col 1), code (col 2), category (col 3), price (col 4), ..., eps (col 9), ..., pe (col 12), dy (col 13), roe (col 14), ..., mcap (col 16)
                    # Extract name and check if it's a link
                    name_cell = cells[0]
                    try:
                        name_link = name_cell.find_element(By.TAG_NAME, "a")
                        name = name_link.text.strip()
                        detail_url = name_link.get_attribute("href")
                        # Make URL absolute if it's relative
                        if detail_url and not detail_url.startswith("http"):
                            base_url = "https://www.klsescreener.com"
                            if detail_url.startswith("/"):
                                detail_url = base_url + detail_url
                            else:
                                detail_url = base_url + "/" + detail_url
                    except:
                        # No link found, just get text
                        name = name_cell.text.strip()
                        detail_url = None
                    
                    # Remove [s] suffix from stock names
                    name = name.replace(" [s]", "").replace("[s]", "").strip()
                    code = cells[1].text.strip()
                    price = _parse_float(cells[3].text.strip()) if len(cells) > 3 else None
                    eps = _parse_float(cells[8].text.strip()) if len(cells) > 8 else None
                    pe_ratio = _parse_float(cells[11].text.strip()) if len(cells) > 11 else None
                    dividend_yield = _parse_float(cells[12].text.strip()) if len(cells) > 12 else None
                    roe = _parse_float(cells[13].text.strip()) if len(cells) > 13 else None
                    market_cap = _parse_float(cells[15].text.strip()) if len(cells) > 15 else None
                    
                    # Debug first company to verify structure
                    if idx == 1:
                        print(f"      [5.14.2.2] First company - name: '{name}', code: '{code}', detail_url: '{detail_url}', price: {price}, eps: {eps}, pe: {pe_ratio}, dy: {dividend_yield}, roe: {roe}, mcap: {market_cap}, sector: '{sector}'")
                    
                    company = Company(
                        name=name,
                        code=code,
                        detail_url=detail_url,
                        price=price,
                        eps=eps,
                        pe_ratio=pe_ratio,
                        dividend_yield=dividend_yield,
                        roe=roe,
                        market_cap=market_cap,
                        sector=sector  # Use the sector parameter passed to function
                    )
                    companies.append(company)
                    if idx % 10 == 0:  # Log every 10 companies
                        print(f"      [5.14.3] Processed {idx}/{len(rows)} companies...")
            except Exception as e:
                logger.warning(f"Error extracting company from row {idx}: {str(e)}")
                continue
        
        print(f"      [5.14.4] ✓ Successfully extracted {len(companies)} companies")
                
    except Exception as e:
        error_msg = f"Error extracting companies from table: {str(e)}"
        print(f"      [5.13.ERROR] {error_msg}")
        logger.error(error_msg)
    
    return companies


def _parse_float(value: str) -> Optional[float]:
    """Parse float value, handling common formatting including %, B/M/K suffixes."""
    if not value or value == "-" or value == "N/A":
        return None
    try:
        # Remove commas and RM
        cleaned = value.replace(",", "").replace("RM", "").strip()
        
        # Handle percentage values (e.g., "1.07%")
        if "%" in cleaned:
            cleaned = cleaned.replace("%", "").strip()
            return float(cleaned)
        
        # Handle B (billions), M (millions), K (thousands) suffixes
        multiplier = 1
        if cleaned.endswith("B") or cleaned.endswith("b"):
            multiplier = 1000000000
            cleaned = cleaned[:-1].strip()
        elif cleaned.endswith("M") or cleaned.endswith("m"):
            multiplier = 1000000
            cleaned = cleaned[:-1].strip()
        elif cleaned.endswith("K") or cleaned.endswith("k"):
            multiplier = 1000
            cleaned = cleaned[:-1].strip()
        
        return float(cleaned) * multiplier
    except (ValueError, AttributeError):
        return None

