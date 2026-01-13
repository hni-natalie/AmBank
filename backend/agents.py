"""Agents module - combines macro/sector/Bursa agents + in-memory vector store."""
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
import time
import logging
from datetime import datetime
from schemas.signals import MacroSignal
from schemas.company import Company, SectorCompanies
from utils.logger import AgentLogger, log_agent_execution

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

SECTOR_STYLE = {
    "Technology": "Growth",
    "Health Care": "Growth",
    "Telecommunications & Media": "Growth",
    "Transportation & Logistics": "Growth",
    "Financial Services": "Value",
    "Utilities": "Value",
    "Real Estate Investment Trusts": "Value",
    "Energy": "Value",
    "Plantation": "Value",
    "Property": "Value",
    "Consumer Products & Services": "Blend",
    "Industrial Products & Services": "Blend",
    "Construction": "Blend"
}


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
    
    # Determine investment style based on sector
    style = SECTOR_STYLE.get(klse_sector, "Blend")  # Default to Blend if not found
    print(f"[STEP 2.1] Determined investment style: '{style}' for sector '{klse_sector}'")
    
    try:
        # KLSE Screener base URL
        base_url = "https://www.klsescreener.com/v2/"
        print(f"[STEP 3] Base URL: {base_url}")
        
        # Try to fetch data using requests first (faster if data is available)
        print(f"[STEP 4] Attempting to fetch via API/HTML parsing...")
        companies = _fetch_companies_via_api(base_url, klse_sector, sector, style)
        
        if not companies:
            # Fallback: Use Selenium for JavaScript-rendered content
            print(f"[STEP 5] API/HTML method returned no results. Switching to Selenium...")
            print(f"[STEP 5.1] Note: Selenium requires ChromeDriver. If it fails, check ChromeDriver installation.")
            logger.info("Attempting to fetch via Selenium...")
            try:
                companies = _fetch_companies_via_selenium(base_url, klse_sector, sector, style)
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
        
        print(f"[STEP 6] Preparing response with {len(companies)} companies...")
        result = SectorCompanies(
            sector=sector,
            companies=companies,
            total_count=len(companies)
        )
        print(f"[STEP 7] ✓ Complete! Returning {result.total_count} companies for sector '{sector}'")
        
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


def _fetch_companies_via_api(base_url: str, klse_sector: str, sector: str, style: str) -> List[Company]:
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
            companies = _parse_company_table(soup, klse_sector, style)
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


def _fetch_companies_via_selenium(base_url: str, klse_sector: str, sector: str, style: str) -> List[Company]:
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
                
                # Determine investment style based on sector
                style = SECTOR_STYLE.get(klse_sector, "Blend")  # Default to Blend if not found
                print(f"  [5.11.0] Determined investment style: '{style}' for sector '{klse_sector}'")
                
                # Define filter values based on style
                filter_values = {
                    "Value": {
                        "pe_max": "20",
                        "market_cap": "200",
                        "ptbv_max": "3",
                        "dy_min": "2",
                        "roe_min": "10"
                    },
                    "Growth": {
                        "pe_max": "25",
                        "market_cap": "200",
                        "roe_min": "12"
                    },
                    "Blend": {
                        "pe_max": "20",
                        "market_cap": "200",
                        "roe_min": "10"
                    }
                }
                filters = filter_values.get(style, filter_values["Blend"])
                print(f"  [5.11.0.1] Filter values for {style} style: {filters}")
                
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
                
                # Fill PTBV max and DY min for Value style
                if style == "Value":
                    # Fill PTBV max field
                    print(f"  [5.11.40] Looking for PTBV (Price-to-Book Value) max input field...")
                    ptbv_max_input = None
                    try:
                        ptbv_labels = driver.find_elements(By.XPATH, "//label[contains(text(), 'PTBV') or contains(text(), 'P/B')]")
                        ptbv_texts = driver.find_elements(By.XPATH, "//*[contains(text(), 'PTBV') or contains(text(), 'P/B')]")
                        
                        for ptbv_element in list(ptbv_labels) + list(ptbv_texts):
                            try:
                                parent = ptbv_element.find_element(By.XPATH, "./ancestor::*[contains(@class, 'form') or contains(@class, 'row') or contains(@class, 'group') or contains(@class, 'field')][1]")
                                inputs = parent.find_elements(By.TAG_NAME, "input")
                                text_inputs = [inp for inp in inputs if inp.get_attribute("type") in ["text", "number", None] or inp.get_attribute("type") == ""]
                                
                                if len(text_inputs) >= 2:
                                    ptbv_max_input = text_inputs[1]  # Second input is max
                                    print(f"  [5.11.41] ✓ Found PTBV max input")
                                    break
                            except:
                                continue
                        
                        if ptbv_max_input:
                            try:
                                ptbv_max_input.clear()
                                print(f"  [5.11.42] Entering '{filters['ptbv_max']}' in PTBV max field...")
                                ptbv_max_input.send_keys(filters['ptbv_max'])
                                print(f"  [5.11.43] ✓ PTBV max field filled with '{filters['ptbv_max']}'")
                                time.sleep(0.5)
                            except Exception as e:
                                print(f"  [5.11.44] ⚠ Failed to fill PTBV max field: {str(e)}")
                        else:
                            print(f"  [5.11.45] ⚠ PTBV max input field not found, continuing...")
                    except Exception as e:
                        print(f"  [5.11.46] ⚠ Error searching for PTBV max field: {str(e)}")
                    
                    # Fill DY min field
                    print(f"  [5.11.47] Looking for DY (Dividend Yield) min input field...")
                    dy_min_input = None
                    try:
                        dy_labels = driver.find_elements(By.XPATH, "//label[contains(text(), 'DY') or contains(text(), 'Dividend Yield')]")
                        dy_texts = driver.find_elements(By.XPATH, "//*[contains(text(), 'DY') or contains(text(), 'Dividend Yield')]")
                        
                        for dy_element in list(dy_labels) + list(dy_texts):
                            try:
                                parent = dy_element.find_element(By.XPATH, "./ancestor::*[contains(@class, 'form') or contains(@class, 'row') or contains(@class, 'group') or contains(@class, 'field')][1]")
                                inputs = parent.find_elements(By.TAG_NAME, "input")
                                text_inputs = [inp for inp in inputs if inp.get_attribute("type") in ["text", "number", None] or inp.get_attribute("type") == ""]
                                
                                if len(text_inputs) >= 1:
                                    dy_min_input = text_inputs[0]  # First input is min
                                    print(f"  [5.11.48] ✓ Found DY min input")
                                    break
                            except:
                                continue
                        
                        if dy_min_input:
                            try:
                                dy_min_input.clear()
                                print(f"  [5.11.49] Entering '{filters['dy_min']}' in DY min field...")
                                dy_min_input.send_keys(filters['dy_min'])
                                print(f"  [5.11.50] ✓ DY min field filled with '{filters['dy_min']}'")
                                time.sleep(0.5)
                            except Exception as e:
                                print(f"  [5.11.51] ⚠ Failed to fill DY min field: {str(e)}")
                        else:
                            print(f"  [5.11.52] ⚠ DY min input field not found, continuing...")
                    except Exception as e:
                        print(f"  [5.11.53] ⚠ Error searching for DY min field: {str(e)}")
                
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
                companies = _extract_companies_from_table(driver, sector, style)
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


def _parse_company_table(soup: BeautifulSoup, sector: str, style: str) -> List[Company]:
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
                        # Table structure: name (col 1), code (col 2), category (col 3), price (col 4), ..., eps (col 9), ..., pe (col 12), dy (col 13), roe (col 14), ..., mcap (col 16)
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
                        category = cells[2].get_text(strip=True) if len(cells) > 2 else None
                        
                        # Filter out companies with "Leap Market" in category
                        if category and "Leap Market" in category:
                            continue
                        
                        price = _parse_float(cells[3].get_text(strip=True)) if len(cells) > 3 else None
                        eps = _parse_float(cells[8].get_text(strip=True)) if len(cells) > 8 else None
                        pe_ratio = _parse_float(cells[11].get_text(strip=True)) if len(cells) > 11 else None
                        dividend_yield = _parse_float(cells[12].get_text(strip=True)) if len(cells) > 12 else None
                        roe = _parse_float(cells[13].get_text(strip=True)) if len(cells) > 13 else None
                        market_cap = _parse_float(cells[15].get_text(strip=True)) if len(cells) > 15 else None
                        
                        # Debug first company to verify structure
                        if idx == 1:
                            print(f"    [4.5.3.3] First company - name: '{name}', code: '{code}', category: '{category}', detail_url: '{detail_url}', price: {price}, eps: {eps}, pe: {pe_ratio}, dy: {dividend_yield}, roe: {roe}, mcap: {market_cap}")
                        
                        company = Company(
                            name=name,
                            code=code,
                            category=category,
                            detail_url=detail_url,
                            price=price,
                            eps=eps,
                            pe_ratio=pe_ratio,
                            dividend_yield=dividend_yield,
                            roe=roe,
                            market_cap=market_cap,
                            sector=sector,  # Use the sector parameter passed to function
                            style=style  # Investment style based on sector
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


def _extract_companies_from_table(driver, sector: str, style: str) -> List[Company]:
    """
    Extract company data from Selenium driver page.
    
    Args:
        driver: Selenium WebDriver instance
        sector: Sector name
        style: Investment style (Value, Growth, or Blend)
        
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
                    category = cells[2].text.strip() if len(cells) > 2 else None
                    
                    # Filter out companies with "Leap Market" in category
                    if category and "Leap Market" in category:
                        continue
                    
                    price = _parse_float(cells[3].text.strip()) if len(cells) > 3 else None
                    eps = _parse_float(cells[8].text.strip()) if len(cells) > 8 else None
                    pe_ratio = _parse_float(cells[11].text.strip()) if len(cells) > 11 else None
                    dividend_yield = _parse_float(cells[12].text.strip()) if len(cells) > 12 else None
                    roe = _parse_float(cells[13].text.strip()) if len(cells) > 13 else None
                    market_cap = _parse_float(cells[15].text.strip()) if len(cells) > 15 else None
                    
                    # Debug first company to verify structure
                    if idx == 1:
                        print(f"      [5.14.2.2] First company - name: '{name}', code: '{code}', category: '{category}', detail_url: '{detail_url}', price: {price}, eps: {eps}, pe: {pe_ratio}, dy: {dividend_yield}, roe: {roe}, mcap: {market_cap}, sector: '{sector}'")
                    
                    company = Company(
                        name=name,
                        code=code,
                        category=category,
                        detail_url=detail_url,
                        price=price,
                        eps=eps,
                        pe_ratio=pe_ratio,
                        dividend_yield=dividend_yield,
                        roe=roe,
                        market_cap=market_cap,
                        sector=sector,  # Use the sector parameter passed to function
                        style=style  # Investment style based on sector
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
    """Parse float value, handling common formatting."""
    if not value or value == "-" or value == "N/A":
        return None
    try:
        # Remove commas and other formatting
        cleaned = value.replace(",", "").replace("RM", "").strip()
        return float(cleaned)
    except (ValueError, AttributeError):
        return None

