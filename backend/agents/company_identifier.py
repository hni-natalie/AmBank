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
        
        Args:
            user_input: User's input text
            
        Returns:
            Company name or None
        """
        # Simple pattern matching (faster and more reliable than RAG for this)
        user_lower = user_input.lower()
        
        # Common patterns for investment queries
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
        
        # Try to extract company name
        for pattern in patterns:
            if pattern in user_lower:
                # Extract text after pattern
                idx = user_lower.find(pattern)
                after_pattern = user_input[idx + len(pattern):].strip()
                # Take first few words (company names are usually 1-3 words)
                words = after_pattern.split()[:3]  # Max 3 words for company name
                if words:
                    potential_name = ' '.join(words)
                    # Clean up punctuation
                    potential_name = potential_name.rstrip('.,!?;:')
                    if len(potential_name) > 2:
                        return potential_name
        
        # If no pattern found, try direct extraction
        # Remove common words and see what's left
        stop_words = ['i', 'want', 'to', 'invest', 'in', 'buy', 'stock', 'shares', 'of', 'the', 'a', 'an']
        words = [w for w in user_input.split() if w.lower() not in stop_words]
        
        if words:
            # Take first 1-3 words as potential company name
            potential_name = ' '.join(words[:3]).strip('.,!?;:')
            if len(potential_name) > 2:
                return potential_name
        
        return None

