"""KLSE Screener scraper for company metadata."""
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Optional
from urllib.parse import quote


class KLSEScraper:
    """Scraper for KLSE Screener company information."""
    
    def __init__(self):
        """Initialize KLSE Screener scraper."""
        self.base_url = "https://www.klsescreener.com/v2"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def search_company(self, company_name: str) -> Optional[Dict]:
        """
        Search for a company on KLSE Screener.
        
        Args:
            company_name: Company name to search for
            
        Returns:
            Dictionary with company metadata or None if not found
        """
        # First: Try to normalize to ticker (most reliable)
        ticker = self._normalize_ticker(company_name)
        if ticker:
            # Use the ticker to construct company info directly
            company_info = {
                'company_name': company_name.title(),  # Capitalize properly
                'ticker': ticker,
                'sector': self._get_sector_from_ticker(ticker),
                'peers': []
            }
            
            # Try to get peers based on sector
            if company_info['sector']:
                company_info['peers'] = self.get_peers_by_sector(
                    company_info['sector'],
                    exclude_company=company_name
                )
            
            # Try to fetch additional info from KLSE (optional, don't fail if it doesn't work)
            try:
                additional_info = self._fetch_company_page(ticker, company_name)
                if additional_info:
                    # Merge additional info
                    if additional_info.get('sector'):
                        company_info['sector'] = additional_info['sector']
                    if additional_info.get('peers'):
                        company_info['peers'] = additional_info['peers']
                    if additional_info.get('company_name'):
                        company_info['company_name'] = additional_info['company_name']
            except:
                # If fetching fails, return what we have from ticker mapping
                pass
            
            return company_info
        
        # Fallback: Try search (but don't rely on it since API might not work)
        try:
            # Try different search endpoints
            search_urls = [
                f"{self.base_url}/stocks/search",
                f"https://www.klsescreener.com/v2/stocks/search",
            ]
            
            for search_url in search_urls:
                try:
                    params = {'q': company_name}
                    response = self.session.get(search_url, params=params, timeout=5)
                    if response.status_code == 200:
                        try:
                            data = response.json()
                            if data and len(data) > 0:
                                company = data[0]
                                return self._extract_company_info(company, company_name)
                        except:
                            pass
                except:
                    continue
        except:
            pass
        
        return None
    
    def _normalize_ticker(self, company_name: str) -> Optional[str]:
        """
        Try to normalize company name to ticker format.
        
        Args:
            company_name: Company name
            
        Returns:
            Ticker in format like "AMBANK.KL" or None
        """
        # Common company name to ticker mappings (expanded list)
        name_to_ticker = {
            'ambank': 'AMBANK',
            'am bank': 'AMBANK',
            'a m bank': 'AMBANK',
            'a.m. bank': 'AMBANK',
            'maybank': 'MAYBANK',
            'malayan banking': 'MAYBANK',
            'cimb': 'CIMB',
            'cimb bank': 'CIMB',
            'cimb group': 'CIMB',
            'public bank': 'PUBLIC',
            'public bank berhad': 'PUBLIC',
            'rhb': 'RHBBANK',
            'rhb bank': 'RHBBANK',
            'hong leong': 'HLBANK',
            'hong leong bank': 'HLBANK',
            'tenaga': 'TENAGA',
            'tenaga nasional': 'TENAGA',
            'tnb': 'TENAGA',
            'petronas': 'PETGAS',
            'petronas gas': 'PETGAS',
            'petgas': 'PETGAS',
            'sime darby': 'SIME',
            'sime': 'SIME',
            'ioi': 'IOICORP',
            'ioi corp': 'IOICORP',
            'ioi corporation': 'IOICORP',
            'genting': 'GENTING',
            'genting berhad': 'GENTING',
            'maxis': 'MAXIS',
            'maxis berhad': 'MAXIS',
            'digi': 'DIGI',
            'digi.com': 'DIGI',
            'axiata': 'AXIATA',
            'telekom': 'TM',
            'telekom malaysia': 'TM',
            'tm': 'TM',
            'sunway': 'SUNWAY',
            'sunway berhad': 'SUNWAY',
            'gamuda': 'GAMUDA',
            'gamuda berhad': 'GAMUDA',
            'ijm': 'IJM',
            'ijm corp': 'IJM',
            'ijm corporation': 'IJM',
            'yinson': 'YINSON',
            'yinson holdings': 'YINSON',
            'top glove': 'TOPGLOV',
            'topglove': 'TOPGLOV',
            'supermax': 'SUPERMX',
            'supermax corporation': 'SUPERMX',
            'hartalega': 'HARTA',
            'hartalega holdings': 'HARTA'
        }
        
        name_lower = company_name.lower().strip()
        
        # Direct match
        if name_lower in name_to_ticker:
            return f"{name_to_ticker[name_lower]}.KL"
        
        # Partial match (check if any key is contained in the name)
        for key, ticker in name_to_ticker.items():
            if key in name_lower:
                return f"{ticker}.KL"
        
        # Reverse: check if name is contained in any key
        for key, ticker in name_to_ticker.items():
            if name_lower in key:
                return f"{ticker}.KL"
        
        return None
    
    def _fetch_company_page(self, ticker: str, company_name: str) -> Optional[Dict]:
        """
        Fetch company information from KLSE Screener stock page.
        This is optional - if it fails, we fall back to ticker mapping.
        
        Args:
            ticker: Stock ticker (e.g., "AMBANK.KL")
            company_name: Original company name
            
        Returns:
            Dictionary with company metadata or None if fetch fails
        """
        try:
            # Remove .KL if present for URL
            ticker_code = ticker.replace('.KL', '').upper()
            
            # Try different URL formats
            urls_to_try = [
                f"{self.base_url}/stocks/view/{ticker_code}",
                f"{self.base_url}/stocks/{ticker_code}",
                f"https://www.klsescreener.com/v2/stocks/view/{ticker_code}",
                f"https://www.klsescreener.com/v2/stocks/{ticker_code}",
            ]
            
            for url in urls_to_try:
                try:
                    response = self.session.get(url, timeout=5)
                    if response.status_code == 200:
                        # Try JSON response first
                        try:
                            data = response.json()
                            if data:
                                return self._extract_company_info(data, company_name)
                        except:
                            pass
                        
                        # Fallback to HTML parsing
                        soup = BeautifulSoup(response.text, "html.parser")
                        
                        company_info = {
                            'company_name': company_name,
                            'ticker': ticker,
                            'sector': None,
                            'peers': []
                        }
                        
                        # Try to find sector/industry from HTML
                        sector_selectors = [
                            '.sector', '.industry', '[data-sector]', '.stock-sector',
                            'td', 'th'
                        ]
                        for selector in sector_selectors:
                            try:
                                elements = soup.select(selector)
                                for elem in elements:
                                    text = elem.get_text(strip=True).lower()
                                    if 'sector' in text or 'industry' in text:
                                        # Try to get the value
                                        next_elem = elem.find_next_sibling()
                                        if next_elem:
                                            sector_text = next_elem.get_text(strip=True)
                                            if sector_text and len(sector_text) < 50:
                                                company_info['sector'] = sector_text
                                                break
                                if company_info['sector']:
                                    break
                            except:
                                continue
                        
                        # Try to find peers
                        peer_links = soup.find_all('a', href=lambda x: x and '/stocks/' in x if x else False)
                        peers = []
                        seen_peers = set()
                        for link in peer_links[:20]:
                            peer_name = link.get_text(strip=True)
                            if (peer_name and 
                                peer_name.lower() != company_name.lower() and
                                peer_name.lower() not in seen_peers and
                                len(peer_name) > 2 and len(peer_name) < 50):
                                peers.append(peer_name)
                                seen_peers.add(peer_name.lower())
                                if len(peers) >= 3:
                                    break
                        
                        company_info['peers'] = peers[:3]
                        return company_info
                except:
                    continue
            
        except Exception as e:
            # Silently fail - we'll use ticker mapping instead
            pass
        
        return None
    
    def _get_sector_from_ticker(self, ticker: str) -> Optional[str]:
        """
        Get sector from ticker using known mappings.
        
        Args:
            ticker: Stock ticker (e.g., "AMBANK.KL")
            
        Returns:
            Sector name or None
        """
        ticker_code = ticker.replace('.KL', '').upper()
        
        # Ticker to sector mapping
        ticker_to_sector = {
            # Banking
            'AMBANK': 'Banking',
            'MAYBANK': 'Banking',
            'CIMB': 'Banking',
            'PUBLIC': 'Banking',
            'RHBBANK': 'Banking',
            'HLBANK': 'Banking',
            # Technology/Telecom
            'MAXIS': 'Telecommunications',
            'DIGI': 'Telecommunications',
            'AXIATA': 'Telecommunications',
            'TM': 'Telecommunications',
            # Energy/Utilities
            'TENAGA': 'Utilities',
            'PETGAS': 'Energy',
            # Construction
            'GAMUDA': 'Construction',
            'IJM': 'Construction',
            'SUNWAY': 'Construction',
            # Plantation
            'IOICORP': 'Plantation',
            'SIME': 'Plantation',
            # Others
            'GENTING': 'Gaming & Hospitality',
            'YINSON': 'Energy',
            'TOPGLOV': 'Healthcare',
            'SUPERMX': 'Healthcare',
            'HARTA': 'Healthcare'
        }
        
        return ticker_to_sector.get(ticker_code)
    
    def _extract_company_info(self, company_data: Dict, company_name: str) -> Dict:
        """
        Extract company information from search result data.
        
        Args:
            company_data: Company data from search API
            company_name: Original company name
            
        Returns:
            Dictionary with company metadata
        """
        ticker = company_data.get('code', '').upper()
        if ticker and not ticker.endswith('.KL'):
            ticker = f"{ticker}.KL"
        
        return {
            'company_name': company_data.get('name', company_name),
            'ticker': ticker or None,
            'sector': company_data.get('sector') or company_data.get('industry'),
            'peers': []  # Will be populated separately if needed
        }
    
    def get_peers_by_sector(self, sector: str, exclude_company: str = None) -> List[str]:
        """
        Get peer companies in the same sector.
        
        Args:
            sector: Sector name
            exclude_company: Company name to exclude from results
            
        Returns:
            List of peer company names
        """
        # Common sector peers mapping (stub - would need actual KLSE API)
        sector_peers = {
            'banking': ['Maybank', 'CIMB', 'Public Bank', 'RHB Bank', 'Hong Leong Bank'],
            'finance': ['Maybank', 'CIMB', 'Public Bank', 'Ambank', 'RHB Bank'],
            'technology': ['Maxis', 'Digi', 'Axiata', 'Telekom Malaysia'],
            'telecommunications': ['Maxis', 'Digi', 'Axiata', 'Telekom Malaysia'],
            'energy': ['Petronas Gas', 'Petronas Chemicals', 'Tenaga Nasional'],
            'utilities': ['Tenaga Nasional', 'YTL Power', 'Malakoff'],
            'construction': ['Gamuda', 'IJM Corp', 'Sunway', 'WCT Holdings'],
            'property': ['Sunway', 'IOI Properties', 'SP Setia', 'UEM Sunrise'],
            'plantation': ['IOI Corp', 'Sime Darby Plantation', 'KLK', 'FGV'],
            'healthcare': ['IHH Healthcare', 'KPJ Healthcare', 'Pharmaniaga']
        }
        
        sector_lower = sector.lower() if sector else ''
        
        # Find matching sector
        for key, peers in sector_peers.items():
            if key in sector_lower or sector_lower in key:
                # Filter out excluded company
                if exclude_company:
                    peers = [p for p in peers if p.lower() != exclude_company.lower()]
                return peers[:3]
        
        return []
