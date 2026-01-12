"""Micro news agent - scrapes sector-specific news, builds vector DB, and generates signals."""
from typing import Dict, List
from scraper.news_scraper import NewsScraper
from rag.rag_system import RAGSystem


class MicroNewsAgent:
    """Agent for sector-specific news analysis."""
    
    def __init__(self):
        """Initialize micro news agent."""
        self.scraper = NewsScraper()
        self.rag = RAGSystem()
        self.rag_prompt = """Based on the following news articles about the {sector} sector in Malaysia, analyze whether investors should BUY, SELL, or HOLD stocks in this sector.

Context from recent news:
{context}

Question: Given the current conditions in the {sector} sector described in the news above, should investors BUY, SELL, or HOLD stocks in this sector? Provide a clear recommendation (BUY/SELL/HOLD) and explain your reasoning in 2-3 sentences.

Answer:"""
    
    def generate_signal(self, sector: str, limit: int = 20) -> Dict:
        """
        Generate micro signal by scraping sector news, building vector DB, and querying RAG.
        
        Args:
            sector: Sector name (e.g., 'technology', 'finance')
            limit: Maximum number of articles to scrape
            
        Returns:
            Dictionary with signal, confidence, summary, and details
        """
        # Step 1: Scrape sector news
        print(f"📰 Scraping {sector} sector news (limit: {limit})...")
        articles = self.scraper.scrape_sector_news(sector, limit=limit)
        
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
        print(f"🔍 Querying RAG system for {sector} sector...")
        query = f"""Based on the following news articles about the {sector} sector in Malaysia, analyze the current sector conditions and provide a clear investment recommendation.

Analyze the {sector} sector news articles provided and determine:
1. Overall sector sentiment (positive/negative/neutral)
2. Key developments or events affecting the {sector} sector
3. Investment recommendation: Should investors BUY, SELL, or HOLD stocks in the {sector} sector?

Provide your answer in this format:
RECOMMENDATION: [BUY/SELL/HOLD]
SENTIMENT: [positive/negative/neutral]
REASONING: [2-3 sentences explaining your recommendation based on the {sector} sector news articles]"""
        
        result = self.rag.query(
            query=query,
            top_k=min(5, len(documents)),  # Don't ask for more than we have
            min_score=0.2,  # Lower threshold
            include_context=True
        )
        
        print(f"📊 Retrieved {result['retrieved_count']} relevant documents from vector store")
        
        answer = result['answer'].strip()
        
        # Step 4: Extract signal and sentiment
        signal, confidence = self._extract_signal_from_answer(answer, result)
        
        # Generate actionable summary
        summary = self._generate_summary(answer, articles, sector, result)
        
        return {
            'sector_stance': signal,
            'confidence': confidence,
            'summary': summary,
            'sector': sector,
            'articles_count': len(articles),
            'rag_answer': answer,
            'retrieved_context_count': result['retrieved_count'],
            'key_points': self._extract_key_points(answer, result),
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
    
    def clear(self):
        """Clear RAG system."""
        self.rag.clear()

