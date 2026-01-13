"""Company identification agent using LLM for better extraction."""
from typing import Dict
from scraper.klse_scraper import CompanyIdentifier
from rag.llm_client import OllamaClient


class CompanyAgent:
    """Agent to identify Malaysian companies from user input."""
    
    def __init__(self):
        """Initialize company agent."""
        self.identifier = CompanyIdentifier()
        self.llm_client = OllamaClient()
    
    def identify_company(self, user_input: str) -> Dict:
        """
        Identify company from user input using LLM + KLSE scraper.
        
        Args:
            user_input: User's input text
            
        Returns:
            JSON-formatted dictionary with company metadata
        """
        # Step 1: Use LLM to extract company name more accurately
        company_name = self._extract_with_llm(user_input)
        
        if not company_name:
            # Fallback to rule-based extraction
            company_name = self.identifier._extract_company_name(user_input)
        
        if not company_name:
            return {
                "company_name": None,
                "ticker": None,
                "sector": None,
                "peers": []
            }
        
        # Step 2: Fetch company metadata from KLSE Screener
        company_info = self.identifier.klse_scraper.search_company(company_name)
        
        if company_info:
            return {
                "company_name": company_info.get('company_name', company_name),
                "ticker": company_info.get('ticker', ''),
                "sector": company_info.get('sector', 'Unknown'),
                "peers": company_info.get('peers', [])
            }
        else:
            return {
                "company_name": None,
                "ticker": None,
                "sector": None,
                "peers": []
            }
    
    def _extract_with_llm(self, user_input: str) -> str:
        """
        Use LLM to extract company name from user input.
        
        Args:
            user_input: User's input text
            
        Returns:
            Extracted company name or empty string
        """
        prompt = f"""Extract the Malaysian company name from the following user input. Return ONLY the company name, nothing else.

User Input: {user_input}

Company Name:"""
        
        try:
            response = self.llm_client.generate(prompt, temperature=0.1)
            # Clean up response
            company_name = response.strip().split('\n')[0].strip()
            # Remove quotes if present
            company_name = company_name.strip('"\'')
            
            if company_name and len(company_name) > 2:
                return company_name
        except Exception as e:
            print(f"LLM extraction failed: {str(e)}")
        
        return ""

