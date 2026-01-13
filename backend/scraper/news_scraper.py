"""News scraper for Yahoo Finance with direct article URLs."""
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests
from typing import List, Dict
import time


class NewsScraper:
    """Scraper for Yahoo Finance news articles using direct URLs."""
    
    # Direct article URLs for each company
    COMPANY_ARTICLES = {
        'KEYFIELD': [
            'https://finance.yahoo.com/news/keyfield-international-berhads-klse-keyfield-231532123.html',
            'https://finance.yahoo.com/news/keyfield-international-berhads-klse-keyfield-223101597.html',
            'https://finance.yahoo.com/news/keyfield-international-berhads-klse-keyfield-030123945.html',
            'https://finance.yahoo.com/news/forecast-analysts-think-keyfield-international-005727386.html',
            'https://finance.yahoo.com/news/keyfield-international-berhad-klse-keyfield-030616001.html'
        ],
        'WASCO': [
            'https://finance.yahoo.com/news/those-invested-wasco-berhad-klse-060227738.html',
            'https://finance.yahoo.com/news/wasco-berhads-klse-wasco-recent-040701202.html',
            'https://finance.yahoo.com/news/private-companies-account-44-wasco-000720843.html',
            'https://finance.yahoo.com/news/unwired-broadband-celebrates-ribbon-cutting-225200451.html',
            'https://finance.yahoo.com/news/buy-wasco-berhad-klse-wasco-003452015.html',
            'https://finance.yahoo.com/news/think-wasco-berhad-klse-wasco-010510905.html',
            'https://finance.yahoo.com/news/wasco-berhads-klse-wasco-investors-015537941.html',
            'https://finance.yahoo.com/news/unwired-broadband-bring-nextgen-fiber-153700417.html'
        ],
        'DELEUM': [
            'https://finance.yahoo.com/news/shareholders-enjoy-repeat-deleum-berhads-050915844.html',
            'https://finance.yahoo.com/news/35-stake-deleum-berhad-klse-042852060.html',
            'https://finance.yahoo.com/news/deleum-berhads-klse-deleum-investors-051713218.html',
            'https://finance.yahoo.com/news/weakness-deleum-berhad-klse-deleum-055633052.html',
            'https://finance.yahoo.com/news/deleum-berhads-klse-deleum-earnings-004455773.html',
            'https://finance.yahoo.com/news/four-days-left-until-deleum-222625539.html',
            'https://finance.yahoo.com/news/investors-undervaluing-deleum-berhad-klse-014852808.html',
            'https://finance.yahoo.com/news/under-bonnet-deleum-berhads-klse-033434322.html',
            'https://finance.yahoo.com/news/insiders-were-biggest-winners-deleum-004904532.html'
        ],
        'DAYANG': [
            'https://finance.yahoo.com/news/dayang-enterprise-holdings-bhd-klse-055442055.html',
            'https://finance.yahoo.com/news/dayang-enterprise-holdings-bhds-klse-002344096.html',
            'https://finance.yahoo.com/news/institutional-investors-own-significant-stake-042804431.html',
            'https://finance.yahoo.com/news/dayang-enterprise-holdings-bhd-klse-025628768.html',
            'https://finance.yahoo.com/news/dayang-enterprise-holdings-bhds-klse-002845382.html',
            'https://finance.yahoo.com/news/dayang-enterprise-holdings-bhds-klse-001455577.html',
            'https://finance.yahoo.com/news/dayang-enterprise-holdings-bhd-second-220807965.html',
            'https://finance.yahoo.com/news/heres-why-think-dayang-enterprise-043926945.html'
        ]
    }
    
    def __init__(self):
        """Initialize news scraper for Yahoo Finance."""
        self.base_url = "https://finance.yahoo.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
    
    def scrape_macro_news(self, limit: int = 20) -> List[Dict]:
        """
        Scrape macro energy sector news from Yahoo Finance.
        
        Args:
            limit: Maximum number of articles to scrape
            
        Returns:
            List of article dictionaries
        """
        url = "https://finance.yahoo.com/sectors/energy/"
        print(f"  📰 Scraping Yahoo Finance Energy Sector...")
        
        articles = []
        seen_titles = set()
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Find news articles on Yahoo Finance
            news_items = soup.find_all(['h3', 'div'], class_=lambda x: x and ('title' in str(x).lower() or 'headline' in str(x).lower()) if x else False)
            
            for item in news_items[:limit * 2]:
                try:
                    link_elem = item.find('a', href=True)
                    if not link_elem:
                        link_elem = item.find_parent('a', href=True)
                    
                    if not link_elem:
                        continue
                    
                    title = link_elem.get_text(strip=True)
                    link = link_elem['href']
                    
                    # Make absolute URL
                    if link.startswith('/'):
                        link = urljoin(self.base_url, link)
                    elif not link.startswith('http'):
                        continue
                    
                    if title and title not in seen_titles and len(title) > 10:
                        article = self._scrape_yahoo_article(link, title)
                        if article:
                            articles.append(article)
                            seen_titles.add(title)
                            
                        if len(articles) >= limit:
                            break
                        
                        time.sleep(0.5)
                        
                except Exception as e:
                    print(f"  ⚠️  Error processing news item: {str(e)}")
                    continue
            
            print(f"  ✅ Scraped {len(articles)} macro articles")
            
        except Exception as e:
            print(f"  ❌ Error scraping Yahoo Finance: {str(e)}")
        
        return articles[:limit]
    
    def scrape_sector_news(self, sector: str, limit: int = 20) -> List[Dict]:
        """
        Scrape sector-specific news (redirects to macro for energy sector).
        
        Args:
            sector: Sector name (should be 'energy')
            limit: Maximum number of articles
            
        Returns:
            List of article dictionaries
        """
        return self.scrape_macro_news(limit=limit)
    
    def scrape_company_news(self, ticker: str, limit: int = 20) -> List[Dict]:
        """
        Scrape company-specific news from predefined Yahoo Finance article URLs.
        
        Args:
            ticker: Company ticker (e.g., 'KEYFIELD', 'WASCO', 'DELEUM', 'DAYANG')
            limit: Maximum number of articles
            
        Returns:
            List of article dictionaries
        """
        # Clean ticker (remove .KL if present)
        ticker_clean = ticker.replace('.KL', '').upper()
        
        # Get article URLs for this company
        article_urls = self.COMPANY_ARTICLES.get(ticker_clean)
        
        if not article_urls:
            print(f"  ⚠️  Ticker {ticker_clean} not supported. Supported: {list(self.COMPANY_ARTICLES.keys())}")
            print(f"  📰 Falling back to energy sector news...")
            return self.scrape_macro_news(limit=limit)
        
        print(f"  📰 Scraping {len(article_urls)} direct articles for {ticker_clean}...")
        
        articles = []
        
        # Scrape each article URL directly
        for url in article_urls[:limit]:
            try:
                article = self._scrape_yahoo_article(url)
                if article:
                    articles.append(article)
                    print(f"  ✅ Scraped: {article['title'][:60]}...")
                    time.sleep(0.3)  # Be respectful
                else:
                    print(f"  ⚠️  Failed to scrape: {url}")
                    
            except Exception as e:
                print(f"  ⚠️  Error scraping {url}: {str(e)}")
                continue
        
        print(f"  ✅ Successfully scraped {len(articles)}/{len(article_urls[:limit])} articles for {ticker_clean}")
        
        return articles
    
    def _scrape_yahoo_article(self, url: str, title: str = None) -> Dict:
        """
        Scrape a single Yahoo Finance article.
        
        Args:
            url: Article URL
            title: Pre-fetched title (optional)
            
        Returns:
            Dictionary with article data or None
        """
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract title if not provided
            if not title:
                title_elem = soup.find('h1') or soup.find('title')
                title = title_elem.get_text(strip=True) if title_elem else "No Title"
            
            # Extract content from Yahoo Finance article
            content = ""
            
            # Try multiple selectors for Yahoo Finance
            content_selectors = [
                'div.caas-body',
                'div.article-body',
                'div[class*="body"]',
                'article p',
                'div.content p'
            ]
            
            for selector in content_selectors:
                paragraphs = soup.select(f'{selector} p')
                if paragraphs:
                    content = ' '.join([p.get_text(strip=True) for p in paragraphs])
                    break
            
            # Fallback: get all paragraphs
            if not content or len(content) < 100:
                paragraphs = soup.find_all('p')
                content = ' '.join([p.get_text(strip=True) for p in paragraphs[:15]])
            
            # Extract date
            date = ""
            date_selectors = ['time', '.date', '.published', '[datetime]', 'time[datetime]']
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
                    'source': 'Yahoo Finance'
                }
                
        except Exception as e:
            print(f"  ⚠️  Error scraping article {url}: {str(e)}")
        
        return None
