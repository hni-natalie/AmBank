"""News scraper for The Edge Malaysia."""
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests
from typing import List, Dict
import time


class NewsScraper:
    """Scraper for The Edge Malaysia news articles."""
    
    def __init__(self, base_url: str = "https://www.theedgemalaysia.com"):
        """
        Initialize news scraper.
        
        Args:
            base_url: Base URL for The Edge Malaysia
        """
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def scrape_articles(self, url: str, limit: int = 20) -> List[Dict]:
        """
        Scrape articles from a specific URL.
        
        Args:
            url: URL to scrape from
            limit: Maximum number of articles to scrape
            
        Returns:
            List of article dictionaries with title, content, and link
        """
        articles = []
        seen_links = set()
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            html = response.text
            soup = BeautifulSoup(html, "html.parser")
            
            # Find article links - look for links in article containers
            article_links = []
            
            # Try to find article containers first (more reliable)
            article_containers = soup.find_all(['article', 'div'], class_=lambda x: x and ('article' in x.lower() or 'post' in x.lower() or 'story' in x.lower() if x else False))
            
            if article_containers:
                # Extract links from article containers
                for container in article_containers:
                    for a in container.find_all("a", href=True):
                        link = urljoin(self.base_url, a['href'])
                        if self._is_valid_article_link(link) and link not in seen_links:
                            article_links.append(link)
                            seen_links.add(link)
            
            # Fallback: find all links and filter
            if not article_links:
                for a in soup.find_all("a", href=True):
                    link = urljoin(self.base_url, a['href'])
                    # Only include valid article links
                    if self._is_valid_article_link(link) and link not in seen_links:
                        article_links.append(link)
                        seen_links.add(link)
            
            # Limit to recent articles
            article_links = article_links[:limit]
            
            # Scrape each article
            for link in article_links:
                article = self._scrape_article(link)
                if article:
                    articles.append(article)
                    time.sleep(0.5)  # Be respectful with requests
            
        except Exception as e:
            print(f"Error scraping {url}: {str(e)}")
        
        return articles[:limit]
    
    def _is_valid_article_link(self, link: str) -> bool:
        """
        Check if link is a valid article link.
        
        Args:
            link: URL to check
            
        Returns:
            True if valid article link
        """
        # Filter out email protection links and other invalid patterns
        invalid_patterns = [
            '/section/', '/tag/', '/author/', '/categories/', 
            '/category/', '/page/', '/search', '/login', '/register',
            '/cdn-cgi/', 'email-protection', '#', 'javascript:', 'mailto:',
            '/tag/', '/author/', '/archive/', '/feed/', '/rss/',
            'twitter.com', 'facebook.com', 'linkedin.com', 'instagram.com'
        ]
        
        if any(pattern in link.lower() for pattern in invalid_patterns):
            return False
        
        # Must be from theedgemalaysia.com domain
        if 'theedgemalaysia.com' not in link:
            return False
        
        # Exclude if it's just the base domain or category listing pages
        if link.rstrip('/').endswith(('theedgemalaysia.com', 
                                      'theedgemalaysia.com/categories',
                                      'theedgemalaysia.com/categories/economy',
                                      'theedgemalaysia.com/categories/malaysia')):
            return False
        
        # Should have article-like structure
        # Valid examples: 
        # - https://theedgemalaysia.com/article-slug
        # - https://theedgemalaysia.com/node/123456
        # - https://theedgemalaysia.com/categories/economy/article-slug
        parts = link.replace(self.base_url, '').strip('/').split('/')
        
        # Must have at least one meaningful path segment
        if len(parts) == 0:
            return False
        
        # Last part should be a meaningful article identifier (not empty, not just a category)
        last_part = parts[-1]
        if not last_part or last_part in ['economy', 'malaysia', 'categories']:
            return False
        
        # Article slugs typically don't contain certain characters or are numeric (node IDs)
        # Valid if it looks like an article slug or node ID
        if last_part.isdigit() or (len(last_part) > 3 and not last_part.startswith('#')):
            return True
        
        return False
    
    def _scrape_article(self, url: str) -> Dict:
        """
        Scrape a single article.
        
        Args:
            url: Article URL
            
        Returns:
            Dictionary with title, content, link, and metadata
        """
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract title
            title_elem = soup.find("h1") or soup.find("title")
            title = title_elem.get_text(strip=True) if title_elem else "No Title"
            
            # Extract content - try multiple selectors
            content = ""
            content_selectors = [
                'div.article-content',
                'div.post-content',
                'article p',
                'div.content p',
                'main p'
            ]
            
            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem:
                    # Get all paragraphs
                    paragraphs = soup.select(f'{selector} p')
                    if paragraphs:
                        content = ' '.join([p.get_text(strip=True) for p in paragraphs])
                        break
            
            # Fallback: get all paragraph text
            if not content:
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text(strip=True) for p in paragraphs[:20]])
            
            # Extract date if available
            date = ""
            date_selectors = ['time', '.date', '.published', '[datetime]']
            for selector in date_selectors:
                date_elem = soup.select_one(selector)
                if date_elem:
                    date = date_elem.get_text(strip=True) or date_elem.get('datetime', '')
                    break
            
            if content and len(content) > 50:  # Only return if we have substantial content
                return {
                    'title': title,
                    'content': content,
                    'link': url,
                    'date': date,
                    'source': 'The Edge Malaysia'
                }
        except Exception as e:
            print(f"Error scraping article {url}: {str(e)}")
        
        return None
    
    def scrape_klse_news(self, limit: int = 20) -> List[Dict]:
        """
        Scrape news from KLSE Screener.
        
        Args:
            limit: Maximum number of articles
            
        Returns:
            List of article dictionaries
        """
        url = "https://www.klsescreener.com/v2/news"
        articles = []
        seen_links = set()
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            html = response.text
            soup = BeautifulSoup(html, "html.parser")
            
            # Find article links - KLSE Screener structure
            article_links = []
            
            # Look for article containers or links
            for a in soup.find_all("a", href=True):
                href = a.get('href', '')
                # KLSE Screener article links typically have /v2/news/ pattern
                if '/v2/news/' in href or '/news/' in href:
                    link = urljoin("https://www.klsescreener.com", href)
                    if link not in seen_links and 'klsescreener.com' in link:
                        article_links.append(link)
                        seen_links.add(link)
            
            # Limit to recent articles
            article_links = article_links[:limit]
            
            # Scrape each article
            for link in article_links:
                article = self._scrape_klse_article(link)
                if article:
                    articles.append(article)
                    time.sleep(0.5)
        except Exception as e:
            print(f"Error scraping KLSE Screener {url}: {str(e)}")
        
        return articles[:limit]
    
    def scrape_nst_economy_news(self, limit: int = 20) -> List[Dict]:
        """
        Scrape news from NST Economy section.
        
        Args:
            limit: Maximum number of articles
            
        Returns:
            List of article dictionaries
        """
        url = "https://www.nst.com.my/business/economy"
        articles = []
        seen_links = set()
        
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            html = response.text
            soup = BeautifulSoup(html, "html.parser")
            
            # Find article links - NST structure
            article_links = []
            
            # Look for article links
            for a in soup.find_all("a", href=True):
                href = a.get('href', '')
                # NST article links typically have /business/ or /economy/ pattern
                if '/business/' in href or '/economy/' in href:
                    link = urljoin("https://www.nst.com.my", href)
                    if link not in seen_links and 'nst.com.my' in link:
                        # Filter out non-article pages
                        if not any(x in link for x in ['/category/', '/tag/', '/author/', '/page/']):
                            article_links.append(link)
                            seen_links.add(link)
            
            # Limit to recent articles
            article_links = article_links[:limit]
            
            # Scrape each article
            for link in article_links:
                article = self._scrape_nst_article(link)
                if article:
                    articles.append(article)
                    time.sleep(0.5)
        except Exception as e:
            print(f"Error scraping NST {url}: {str(e)}")
        
        return articles[:limit]
    
    def _scrape_klse_article(self, url: str) -> Dict:
        """Scrape a single KLSE Screener article."""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract title
            title_elem = soup.find("h1") or soup.find("title")
            title = title_elem.get_text(strip=True) if title_elem else "No Title"
            
            # Extract content
            content = ""
            content_selectors = [
                'div.article-content',
                'div.post-content',
                'article p',
                'div.content p',
                'main p',
                '.news-content p'
            ]
            
            for selector in content_selectors:
                paragraphs = soup.select(f'{selector} p')
                if paragraphs:
                    content = ' '.join([p.get_text(strip=True) for p in paragraphs])
                    break
            
            # Fallback
            if not content:
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text(strip=True) for p in paragraphs[:20]])
            
            # Extract date
            date = ""
            date_selectors = ['time', '.date', '.published', '[datetime]', '.news-date']
            for selector in date_selectors:
                date_elem = soup.select_one(selector)
                if date_elem:
                    date = date_elem.get_text(strip=True) or date_elem.get('datetime', '')
                    break
            
            if content and len(content) > 50:
                return {
                    'title': title,
                    'content': content,
                    'link': url,
                    'date': date,
                    'source': 'KLSE Screener'
                }
        except Exception as e:
            print(f"Error scraping KLSE article {url}: {str(e)}")
        
        return None
    
    def _scrape_nst_article(self, url: str) -> Dict:
        """Scrape a single NST article."""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract title
            title_elem = soup.find("h1") or soup.find("title")
            title = title_elem.get_text(strip=True) if title_elem else "No Title"
            
            # Extract content
            content = ""
            content_selectors = [
                'div.article-content',
                'div.post-content',
                'article p',
                'div.content p',
                'main p',
                '.article-body p',
                '.story-body p'
            ]
            
            for selector in content_selectors:
                paragraphs = soup.select(f'{selector} p')
                if paragraphs:
                    content = ' '.join([p.get_text(strip=True) for p in paragraphs])
                    break
            
            # Fallback
            if not content:
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text(strip=True) for p in paragraphs[:20]])
            
            # Extract date
            date = ""
            date_selectors = ['time', '.date', '.published', '[datetime]', '.article-date']
            for selector in date_selectors:
                date_elem = soup.select_one(selector)
                if date_elem:
                    date = date_elem.get_text(strip=True) or date_elem.get('datetime', '')
                    break
            
            if content and len(content) > 50:
                return {
                    'title': title,
                    'content': content,
                    'link': url,
                    'date': date,
                    'source': 'New Straits Times'
                }
        except Exception as e:
            print(f"Error scraping NST article {url}: {str(e)}")
        
        return None
    
    def scrape_macro_news(self, limit: int = 20) -> List[Dict]:
        """
        Scrape macro economic/market news from multiple sources.
        
        Args:
            limit: Maximum number of articles per source (total will be up to 3x limit)
            
        Returns:
            List of article dictionaries from all sources
        """
        all_articles = []
        seen_titles = set()
        
        # Source 1: The Edge Malaysia Economy
        print("  📰 Scraping The Edge Malaysia...")
        edge_articles = self.scrape_articles("https://theedgemalaysia.com/categories/economy", limit=limit)
        for article in edge_articles:
            if article['title'] not in seen_titles:
                all_articles.append(article)
                seen_titles.add(article['title'])
        
        # Source 2: KLSE Screener
        print("  📰 Scraping KLSE Screener...")
        klse_articles = self.scrape_klse_news(limit=limit)
        for article in klse_articles:
            if article['title'] not in seen_titles:
                all_articles.append(article)
                seen_titles.add(article['title'])
        
        # Source 3: NST Economy
        print("  📰 Scraping New Straits Times Economy...")
        nst_articles = self.scrape_nst_economy_news(limit=limit)
        for article in nst_articles:
            if article['title'] not in seen_titles:
                all_articles.append(article)
                seen_titles.add(article['title'])
        
        return all_articles[:limit * 3]  # Return up to 3x limit from all sources
    
    def scrape_sector_news(self, sector: str, limit: int = 20) -> List[Dict]:
        """
        Scrape sector-specific news from multiple sources.
        
        Args:
            sector: Sector name (e.g., 'technology', 'finance', 'healthcare')
            limit: Maximum number of articles per source
            
        Returns:
            List of article dictionaries filtered by sector
        """
        # Map sectors to potential keywords
        sector_keywords = {
            'technology': ['tech', 'digital', 'technology', 'software', 'ai', 'ict', 'telecom', 'cloud', 'data'],
            'finance': ['bank', 'finance', 'financial', 'banking', 'investment', 'lender', 'credit', 'epf', 'fund'],
            'healthcare': ['health', 'medical', 'pharmaceutical', 'hospital', 'clinic', 'healthcare', 'biotech'],
            'energy': ['energy', 'oil', 'gas', 'petroleum', 'renewable', 'power', 'electricity', 'petronas'],
            'consumer': ['retail', 'consumer', 'f&b', 'food', 'beverage', 'shopping', 'mall', 'retailer'],
            'industrial': ['industrial', 'manufacturing', 'construction', 'factory', 'production', 'infrastructure']
        }
        
        all_articles = []
        seen_titles = set()
        
        # Source 1: The Edge Malaysia Economy
        print(f"  📰 Scraping The Edge Malaysia for {sector} sector...")
        edge_articles = self.scrape_articles("https://theedgemalaysia.com/categories/economy", limit=limit * 2)
        for article in edge_articles:
            if article['title'] not in seen_titles:
                all_articles.append(article)
                seen_titles.add(article['title'])
        
        # Source 2: KLSE Screener
        print(f"  📰 Scraping KLSE Screener for {sector} sector...")
        klse_articles = self.scrape_klse_news(limit=limit * 2)
        for article in klse_articles:
            if article['title'] not in seen_titles:
                all_articles.append(article)
                seen_titles.add(article['title'])
        
        # Source 3: NST Economy
        print(f"  📰 Scraping New Straits Times Economy for {sector} sector...")
        nst_articles = self.scrape_nst_economy_news(limit=limit * 2)
        for article in nst_articles:
            if article['title'] not in seen_titles:
                all_articles.append(article)
                seen_titles.add(article['title'])
        
        # Filter articles by sector keywords
        keywords = sector_keywords.get(sector.lower(), [sector.lower()])
        filtered_articles = []
        
        for article in all_articles:
            title_lower = article['title'].lower()
            content_lower = article['content'].lower()
            
            # Check if article mentions sector keywords
            if any(keyword in title_lower or keyword in content_lower for keyword in keywords):
                filtered_articles.append(article)
                if len(filtered_articles) >= limit:
                    break
        
        return filtered_articles[:limit]

