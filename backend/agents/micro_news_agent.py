"""Micro news agent - scrapes sector-specific news, builds vector DB, and generates signals."""
from typing import Dict, List, Optional
from scraper.news_scraper import NewsScraper
from rag.rag_system import RAGSystem
import hashlib


class MicroNewsAgent:
    """Agent for sector-specific news analysis."""
    
    def __init__(self, persist: bool = False, db_path: Optional[str] = None):
        """
        Initialize micro news agent.
        
        Args:
            persist: Whether to persist vector database to disk
            db_path: Path to store vector database (required if persist=True)
        """
        self.scraper = NewsScraper()
        self.rag = RAGSystem(persist=persist, db_path=db_path)
        # Cache for articles (key: ticker_hash, value: articles list)
        self._article_cache: Dict[str, List[Dict]] = {}
        self.persist = persist
        self.db_path = db_path
        self.rag_prompt = """Based on the following news articles about the {sector} sector in Malaysia, analyze whether investors should BUY, SELL, or HOLD stocks in this sector.

Context from recent news:
{context}

Question: Given the current conditions in the {sector} sector described in the news above, should investors BUY, SELL, or HOLD stocks in this sector? Provide a clear recommendation (BUY/SELL/HOLD) and explain your reasoning in 2-3 sentences.

Answer:"""
    
    def generate_signal(self, ticker: str = None, company_name: str = None, sector: str = None, limit: int = 20, use_cache: bool = True) -> Dict:
        """
        Generate micro signal by scraping company-specific news, building vector DB, and querying RAG.
        
        Args:
            ticker: Stock ticker (e.g., "KEYFIELD") - for filtering company-specific news
            company_name: Company name (e.g., "Keyfield") - for filtering company-specific news
            sector: Sector name (e.g., 'energy') - fallback if no ticker/company
            limit: Maximum number of articles to scrape
            use_cache: Whether to use cached articles for consistency testing
            
        Returns:
            Dictionary with signal, confidence, summary, and details
        """
        # Step 1: Scrape news (with caching for consistency)
        cache_key = self._get_cache_key(ticker, company_name, sector, limit)
        
        if use_cache and cache_key in self._article_cache:
            print(f"📰 Using cached articles (limit: {limit})...")
            articles = self._article_cache[cache_key]
        else:
            if ticker or company_name:
                # Use company-specific scraping from Yahoo Finance
                print(f"📰 Scraping company-specific news for {ticker or company_name} (limit: {limit})...")
                # Extract ticker code (remove .KL if present)
                ticker_code = (ticker or company_name).replace('.KL', '').upper()
                articles = self.scraper.scrape_company_news(ticker_code, limit=limit)
            else:
                # Fallback to sector news (macro energy)
                print(f"📰 Scraping {sector} sector news (limit: {limit})...")
                articles = self.scraper.scrape_sector_news(sector, limit=limit)
            
            # Sort articles consistently by title for deterministic processing
            articles = sorted(articles, key=lambda x: x.get('title', '').lower())
            
            # Cache articles for consistency
            if use_cache:
                self._article_cache[cache_key] = articles
        
        if not articles:
            return {
                'sector_stance': 'neutral',
                'confidence': 0.5,
                'summary': f'No {sector} sector news articles found.',
                'sector': sector,
                'articles_count': 0,
                'details': []
            }
        
        print(f"✅ Scraped {len(articles)} {sector} sector articles")
        
        # Step 2: Build vector DB
        print(f"🔨 Building vector database for {sector} sector...")
        self.rag.clear()  # Clear previous session
        
        # Add articles to RAG - use FULL content
        documents = []
        for article in articles:
            content = article.get('content', '').strip()
            if not content or len(content) < 50:
                continue  # Skip articles with insufficient content
            
            doc_text = f"Title: {article['title']}\n\nContent: {content}"
            documents.append(doc_text)
        
        if not documents:
            return {
                'sector_stance': 'neutral',
                'confidence': 0.5,
                'summary': f'No valid {sector} sector articles with content found.',
                'sector': sector,
                'articles_count': len(articles),
                'details': []
            }
        
        self.rag.add_documents(documents)
        print(f"✅ Added {len(documents)} documents to vector DB (total vectors: {self.rag.vector_store.size()})")
        
        # Verify vector store is populated
        if self.rag.vector_store.size() == 0:
            print(f"⚠️  Warning: Vector store is empty after adding {sector} sector documents!")
            return {
                'sector_stance': 'neutral',
                'confidence': 0.5,
                'summary': f'Vector store failed to populate for {sector} sector.',
                'sector': sector,
                'articles_count': len(articles),
                'details': []
            }
        
        # Step 3: Query RAG with improved prompt
        company_context = f" for {company_name or ticker}" if (company_name or ticker) else f" in the {sector} sector"
        print(f"🔍 Querying RAG system{company_context}...")
        query = f"""Based on the following news articles about {company_name or ticker or f'the {sector} sector'} in Malaysia, analyze the current conditions and provide a clear investment recommendation.

Analyze the news articles provided and determine:
1. Overall sentiment (positive/negative/neutral)
2. Key developments or events affecting {company_name or ticker or f'the {sector} sector'}
3. Investment recommendation: Should investors BUY, SELL, or HOLD stocks?

Categorize each relevant news item as:
- POSITIVE: News that supports buying or indicates favorable conditions
- ADVERSE: News that suggests selling or indicates unfavorable conditions  
- TREND: News that indicates ongoing trends or patterns

Provide your answer in this format:
RECOMMENDATION: [BUY/SELL/HOLD]
SENTIMENT: [positive/negative/neutral]
REASONING: [2-3 sentences explaining your recommendation based on the news articles]
POSITIVE_SIGNALS:
- [Signal 1]
- [Signal 2]
ADVERSE_SIGNALS:
- [Signal 1]
- [Signal 2]
TREND_SIGNALS:
- [Signal 1]
- [Signal 2]"""
        
        result = self.rag.query(
            query=query,
            top_k=min(5, len(documents)),  # Don't ask for more than we have
            min_score=0.2,  # Lower threshold
            include_context=True,
            temperature=0.1,  # Low temperature for consistency
            top_p=0.9,  # Consistent sampling
            seed=42  # Fixed seed for deterministic output
        )
        
        print(f"📊 Retrieved {result['retrieved_count']} relevant documents from vector store")
        
        answer = result['answer'].strip()
        
        # Step 4: Extract signal and sentiment
        signal, confidence = self._extract_signal_from_answer(answer, result)
        
        # Generate actionable summary
        summary = self._generate_summary(answer, articles, sector or company_name or ticker, result)
        
        # Step 5: Parse signals into Positive/Adverse/Trend
        positive_signals, adverse_signals, trend_signals = self._parse_signals(answer, result)
        
        return {
            'sector_stance': signal,
            'confidence': confidence,
            'summary': summary,
            'sector': sector,
            'ticker': ticker,
            'company_name': company_name,
            'articles_count': len(articles),
            'rag_answer': answer,
            'retrieved_context_count': result['retrieved_count'],
            'key_points': self._extract_key_points(answer, result),
            'positive_signals': positive_signals,
            'adverse_signals': adverse_signals,
            'trend_signals': trend_signals,
            'details': [
                {
                    'title': article['title'],
                    'link': article['link'],
                    'date': article.get('date', 'N/A'),
                    'source': article.get('source', 'Unknown')
                }
                for article in articles[:5]  # Top 5 articles
            ]
        }
    
    def _extract_signal_from_answer(self, answer: str, rag_result: Dict) -> tuple:
        """
        Extract signal (BUY/SELL/HOLD) and confidence from RAG answer.
        
        Args:
            answer: RAG answer text
            rag_result: Full RAG result
            
        Returns:
            Tuple of (signal, confidence)
        """
        answer_upper = answer.upper()
        
        # Determine signal
        if 'BUY' in answer_upper and 'SELL' not in answer_upper:
            signal = 'positive'  # Buy = positive for sector
            # Higher confidence if more context retrieved
            confidence = min(0.9, 0.6 + (rag_result['retrieved_count'] * 0.05))
        elif 'SELL' in answer_upper:
            signal = 'negative'  # Sell = negative for sector
            confidence = min(0.9, 0.6 + (rag_result['retrieved_count'] * 0.05))
        elif 'HOLD' in answer_upper:
            signal = 'neutral'
            confidence = min(0.8, 0.5 + (rag_result['retrieved_count'] * 0.03))
        else:
            # Default to neutral if unclear
            signal = 'neutral'
            confidence = 0.5
        
        return signal, confidence
    
    def _generate_summary(self, answer: str, articles: List[Dict], sector: str, rag_result: Dict) -> str:
        """
        Generate actionable summary from RAG answer.
        
        Args:
            answer: RAG answer
            articles: List of articles
            sector: Sector name
            rag_result: RAG result with context info
            
        Returns:
            Summary string
        """
        # Extract reasoning section if present
        if 'REASONING:' in answer:
            reasoning = answer.split('REASONING:')[1].strip()
            summary = reasoning.split('\n')[0] if '\n' in reasoning else reasoning[:200]
        elif 'reasoning' in answer.lower():
            parts = answer.split('reasoning')
            if len(parts) > 1:
                summary = parts[1].strip().split('\n')[0][:200]
            else:
                summary = answer[:200]
        else:
            summary = answer[:200]
        
        # Add context info
        if rag_result.get('retrieved_count', 0) > 0:
            summary += f" (Analyzed {rag_result['retrieved_count']} relevant {sector} articles from {len(articles)} total)"
        else:
            summary += f" (Based on {len(articles)} {sector} articles, but context retrieval had issues)"
        
        return summary
    
    def _extract_key_points(self, answer: str, rag_result: Dict) -> List[str]:
        """Extract key points from RAG answer."""
        key_points = []
        
        # Look for bullet points or numbered items
        lines = answer.split('\n')
        for line in lines:
            line = line.strip()
            if line and (line.startswith('-') or line.startswith('•') or 
                        line[0].isdigit() and '. ' in line[:3]):
                key_points.append(line)
        
        # If no bullets, extract sentences
        if not key_points:
            sentences = [s.strip() for s in answer.split('.') if len(s.strip()) > 20]
            key_points = sentences[:3]  # Top 3 sentences
        
        return key_points[:5]  # Max 5 key points
    
    def _filter_articles_by_company(self, articles: List[Dict], ticker: str = None, company_name: str = None) -> List[Dict]:
        """
        Filter articles by company ticker or name.
        Only supports energy companies: WASCO, DELEUM, DAYANG, KEYFIELD.
        
        Args:
            articles: List of article dictionaries
            ticker: Stock ticker (e.g., "WASCO.KL", "DELEUM.KL", "DAYANG.KL", "KEYFIELD.KL")
            company_name: Company name (e.g., "Wasco", "Deleum", "Dayang", "Keyfield")
            
        Returns:
            Filtered list of articles
        """
        if not ticker and not company_name:
            return articles
        
        filtered = []
        ticker_code = ticker.replace('.KL', '').upper() if ticker else None
        
        # Only process if it's one of the supported energy companies
        supported_companies = ['WASCO', 'DELEUM', 'DAYANG', 'KEYFIELD']
        if ticker_code and ticker_code not in supported_companies:
            return []  # Return empty if not a supported company
        
        # Company name variations for energy companies
        company_variations = []
        if company_name:
            company_variations.append(company_name.lower())
        
        if ticker_code:
            company_variations.append(ticker_code.lower())
            # Add full company names
            if ticker_code == 'WASCO':
                company_variations.extend(['wasco energy', 'wasco energy group'])
            elif ticker_code == 'DELEUM':
                company_variations.extend(['deleum berhad', 'deleum group'])
            elif ticker_code == 'DAYANG':
                company_variations.extend(['dayang enterprise', 'dayang enterprise holdings', 'dayang holdings'])
            elif ticker_code == 'KEYFIELD':
                company_variations.extend(['keyfield berhad', 'keyfield group'])
        
        for article in articles:
            title_lower = article.get('title', '').lower()
            content_lower = article.get('content', '').lower()
            
            # Check if article mentions company
            for variation in company_variations:
                if variation and (variation in title_lower or variation in content_lower):
                    filtered.append(article)
                    break
        
        return filtered[:20]  # Limit to 20 articles
    
    def _parse_signals(self, answer: str, rag_result: Dict) -> tuple:
        """
        Parse signals from RAG answer into Positive/Adverse/Trend categories.
        
        Args:
            answer: RAG answer text
            rag_result: Full RAG result with context
            
        Returns:
            Tuple of (positive_signals, adverse_signals, trend_signals)
        """
        positive_signals = []
        adverse_signals = []
        trend_signals = []
        
        answer_lower = answer.lower()
        
        # Extract from structured format if present
        if 'POSITIVE_SIGNALS:' in answer:
            pos_section = answer.split('POSITIVE_SIGNALS:')[1]
            if 'ADVERSE_SIGNALS:' in pos_section:
                pos_section = pos_section.split('ADVERSE_SIGNALS:')[0]
            lines = pos_section.split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•')):
                    signal = line.lstrip('- •').strip()
                    if signal:
                        positive_signals.append(signal)
        
        if 'ADVERSE_SIGNALS:' in answer:
            adv_section = answer.split('ADVERSE_SIGNALS:')[1]
            if 'TREND_SIGNALS:' in adv_section:
                adv_section = adv_section.split('TREND_SIGNALS:')[0]
            lines = adv_section.split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•')):
                    signal = line.lstrip('- •').strip()
                    if signal:
                        adverse_signals.append(signal)
        
        if 'TREND_SIGNALS:' in answer:
            trend_section = answer.split('TREND_SIGNALS:')[1]
            lines = trend_section.split('\n')
            for line in lines:
                line = line.strip()
                if line and (line.startswith('-') or line.startswith('•')):
                    signal = line.lstrip('- •').strip()
                    if signal:
                        trend_signals.append(signal)
        
        # Fallback: Extract from context if structured format not found
        if not positive_signals and not adverse_signals and not trend_signals:
            context_texts = rag_result.get('context', [])
            for context in context_texts[:3]:  # Analyze top 3 contexts
                context_lower = context.lower()
                # Simple keyword-based categorization
                positive_keywords = [
                    'growth', 'supply', 'demand', 'increase', 'profit', 'gain', 
                    'positive', 'strong', 'improve', 'rise', 'up',
                    'capacity expansion', 'renewable adoption', 'solar', 'wind', 
                    'efficiency', 'investment', 'grid upgrade', 'project award', 
                    'production increase', 'output growth', 'sales growth'
                ]
                
                adverse_keywords = [
                    'decline', 'decrease', 'loss', 'negative', 'weak', 'fall', 
                    'down', 'risk', 'concern',
                    'supply shortage', 'blackout', 'project delay', 'cost overrun', 
                    'regulatory risk', 'penalty', 'fine', 'shutdown', 'emission violation', 
                    'price drop', 'fuel shortage'
                ]
                
                trend_keywords = [
                    'trend', 'pattern', 'continue', 'ongoing', 'maintain', 'stable',
                    'energy transition', 'decarbonisation', 'renewable growth', 'policy shift',
                    'technology adoption', 'demand pattern', 'price trend', 'capacity trend', 
                    'long-term plan', 'strategic move', 'market outlook'
                ]

                
                pos_count = sum(1 for kw in positive_keywords if kw in context_lower)
                adv_count = sum(1 for kw in adverse_keywords if kw in context_lower)
                trend_count = sum(1 for kw in trend_keywords if kw in context_lower)
                
                # Extract a sentence from context
                sentences = context.split('.')
                if sentences:
                    signal_text = sentences[0].strip()[:150]  # First sentence, max 150 chars
                    if pos_count > adv_count and pos_count > 0:
                        positive_signals.append(signal_text)
                    elif adv_count > pos_count and adv_count > 0:
                        adverse_signals.append(signal_text)
                    elif trend_count > 0:
                        trend_signals.append(signal_text)
        
        return positive_signals[:5], adverse_signals[:5], trend_signals[:5]  # Max 5 each
    
    def _get_cache_key(self, ticker: Optional[str], company_name: Optional[str], sector: Optional[str], limit: int) -> str:
        """Generate cache key for articles."""
        key_data = f"{ticker or ''}_{company_name or ''}_{sector or ''}_{limit}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def clear_cache(self):
        """Clear article cache."""
        self._article_cache.clear()
    
    def clear(self):
        """Clear RAG system."""
        self.rag.clear()

