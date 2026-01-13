"""Company identifier agent - identifies Malaysian companies from user input."""
from typing import Dict, Optional
from scraper.klse_scraper import KLSEScraper
from rag.rag_system import RAGSystem


class CompanyIdentifier:
    """Agent for identifying Malaysian companies from user input."""
    
    def __init__(self):
        """Initialize company identifier."""
        self.scraper = KLSEScraper()
        self.rag = RAGSystem()
    
    def identify_company(self, user_input: str) -> Dict:
        """
        Identify company from user input and fetch metadata.
        
        Args:
            user_input: User's input text
            
        Returns:
            Dictionary with company_name, ticker, sector, peers
        """
        # Step 1: Use RAG to extract company name from user input
        company_name = self._extract_company_name(user_input)
        
        if not company_name:
            return {
                "company_name": None,
                "ticker": None,
                "sector": None,
                "peers": []
            }
        
        # Step 2: Search KLSE Screener for company
        company_info = self.scraper.search_company(company_name)
        
        if not company_info:
            return {
                "company_name": None,
                "ticker": None,
                "sector": None,
                "peers": []
            }
        
        # Step 3: Get peers if sector is known
        if company_info.get('sector') and not company_info.get('peers'):
            peers = self.scraper.get_peers_by_sector(
                company_info['sector'],
                exclude_company=company_info.get('company_name')
            )
            company_info['peers'] = peers
        
        return company_info
    
    def _extract_company_name(self, user_input: str) -> Optional[str]:
        """
        Extract company name from user input using pattern matching.
        Only supports energy companies: WASCO, DELEUM, DAYANG, KEYFIELD.
        
        Args:
            user_input: User's input text
            
        Returns:
            Company name (WASCO, DELEUM, DAYANG, or KEYFIELD) or None
        """
        # Supported energy companies
        supported_companies = {
            'wasco': 'WASCO',
            'deleum': 'DELEUM',
            'dayang': 'DAYANG',
            'keyfield': 'KEYFIELD'
        }
        
        user_lower = user_input.lower()
        
        # Check for direct mentions of supported companies
        for key, company in supported_companies.items():
            if key in user_lower:
                return company
        
        # Check for ticker format
        if 'wasco' in user_lower or 'wasco.kl' in user_lower:
            return 'WASCO'
        if 'deleum' in user_lower or 'deleum.kl' in user_lower:
            return 'DELEUM'
        if 'dayang' in user_lower or 'dayang.kl' in user_lower:
            return 'DAYANG'
        if 'keyfield' in user_lower or 'keyfield.kl' in user_lower:
            return 'KEYFIELD'
        
        # Try pattern matching
        patterns = [
            'invest in',
            'buy',
            'stock in',
            'shares of',
            'company',
            'ticker',
            'want to',
            'looking at',
            'interested in'
        ]
        
        for pattern in patterns:
            if pattern in user_lower:
                idx = user_lower.find(pattern)
                after_pattern = user_input[idx + len(pattern):].strip()
                words = after_pattern.split()[:3]
                if words:
                    potential_name = ' '.join(words).rstrip('.,!?;:').lower()
                    # Check if it matches a supported company
                    for key, company in supported_companies.items():
                        if key in potential_name:
                            return company
        
        return None

