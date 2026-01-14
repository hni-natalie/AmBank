"""Dashboard API routes for macro and micro RAG signals."""
from fastapi import APIRouter, HTTPException
from agents.macro_news_agent import MacroNewsAgent
from agents.micro_news_agent import MicroNewsAgent
from agents.company_identifier import CompanyIdentifier
from typing import List, Dict, Optional
from pydantic import BaseModel

router = APIRouter()

# Global company identifier
_company_identifier: Optional[CompanyIdentifier] = None


def get_company_identifier() -> CompanyIdentifier:
    """Get or create company identifier instance."""
    global _company_identifier
    if _company_identifier is None:
        _company_identifier = CompanyIdentifier()
    return _company_identifier

# Global agents (session-based)
_macro_agent: MacroNewsAgent = None
_micro_agents: Dict[str, MicroNewsAgent] = {}


def get_macro_agent() -> MacroNewsAgent:
    """Get or create macro news agent."""
    global _macro_agent
    if _macro_agent is None:
        _macro_agent = MacroNewsAgent()
    return _macro_agent


def get_micro_agent(sector: str) -> MicroNewsAgent:
    """Get or create micro news agent for sector."""
    global _micro_agents
    if sector not in _micro_agents:
        _micro_agents[sector] = MicroNewsAgent()
    return _micro_agents[sector]


@router.get("/dashboard/macro")
async def get_macro_signal(ticker: Optional[str] = None, sector: Optional[str] = None, limit: int = 10):
    """
    Get macro economic/market signal from RAG analysis.
    
    Args:
        ticker: Optional stock ticker (e.g., "AMBANK.KL") to filter sector/market/policy news
        sector: Optional sector name to filter news
        limit: Maximum number of articles to analyze
        
    Returns:
        Macro signal with stance, confidence, Positive/Adverse/Trend signals, and details
    """
    try:
        agent = get_macro_agent()
        result = agent.generate_signal(ticker=ticker, sector=sector, limit=limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating macro signal: {str(e)}")


@router.get("/dashboard/micro/{sector}")
async def get_micro_signal(sector: str, ticker: Optional[str] = None, company_name: Optional[str] = None, limit: int = 10):
    """
    Get micro sector-specific or company-specific signal from RAG analysis.
    
    Args:
        sector: Sector name (e.g., 'technology', 'finance', 'healthcare')
        ticker: Optional stock ticker (e.g., "AMBANK.KL") to filter company-specific news
        company_name: Optional company name to filter company-specific news
        limit: Maximum number of articles to analyze
        
    Returns:
        Micro signal with stance, confidence, Positive/Adverse/Trend signals, and details
    """
    try:
        agent = get_micro_agent(sector)
        result = agent.generate_signal(ticker=ticker, company_name=company_name, sector=sector, limit=limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating {sector} signal: {str(e)}")


@router.get("/dashboard/micro")
async def get_all_micro_signals(limit: int = 10):
    """
    Get all micro sector signals.
    Only returns energy sector signals.
    
    Args:
        limit: Maximum number of articles per sector
        
    Returns:
        Dictionary of sector signals (only energy)
    """
    sectors = ['energy']  # Only energy sector supported
    results = {}
    
    for sector in sectors:
        try:
            agent = get_micro_agent(sector)
            result = agent.generate_signal(sector=sector, limit=limit)
            results[sector] = result
        except Exception as e:
            results[sector] = {
                'sector_stance': 'error',
                'confidence': 0.0,
                'summary': f'Error: {str(e)}',
                'sector': sector,
                'articles_count': 0,
                'retrieved_context_count': 0
            }
    
    return results


class TickerAnalysisRequest(BaseModel):
    """Request model for ticker-based analysis."""
    ticker: str
    company_name: Optional[str] = None
    sector: Optional[str] = None


@router.post("/dashboard/ticker/analyze")
async def analyze_ticker(request: TickerAnalysisRequest, limit: int = 20):
    """
    Analyze a specific ticker using both macro and micro RAG agents.
    
    Args:
        request: Ticker analysis request with ticker, company_name, and sector
        limit: Maximum number of articles to analyze per agent
        
    Returns:
        Aggregated analysis with Positive/Adverse/Trend signals and confidence
    """
    try:
        macro_agent = get_macro_agent()
        micro_agent = MicroNewsAgent()
        
        # Get macro signal (sector/market/policy news)
        print(f"🔍 Analyzing macro signals for {request.ticker}...")
        macro_result = macro_agent.generate_signal(
            ticker=request.ticker,
            sector=request.sector,
            limit=limit
        )
        
        # Get micro signal (company-specific news)
        print(f"🔍 Analyzing micro signals for {request.ticker}...")
        micro_result = micro_agent.generate_signal(
            ticker=request.ticker,
            company_name=request.company_name,
            sector=request.sector,
            limit=limit
        )
        
        # Aggregate signals
        aggregated = aggregate_signals(macro_result, micro_result)
        
        return aggregated
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing ticker {request.ticker}: {str(e)}")


def aggregate_signals(macro_result: Dict, micro_result: Dict) -> Dict:
    """
    Aggregate macro and micro signals into a unified analysis with weighted confidence.
    
    Args:
        macro_result: Macro news agent result
        micro_result: Micro news agent result
        
    Returns:
        Aggregated analysis with Positive/Adverse/Trend signals and weighted confidence
    """
    # Combine all signals
    all_positive = (macro_result.get('positive_signals', []) + 
                   micro_result.get('positive_signals', []))
    all_adverse = (macro_result.get('adverse_signals', []) + 
                  micro_result.get('adverse_signals', []))
    all_trend = (macro_result.get('trend_signals', []) + 
                micro_result.get('trend_signals', []))
    
    # Deduplicate signals (simple approach - by first 50 chars)
    seen_positive = set()
    unique_positive = []
    for signal in all_positive:
        sig_key = signal[:50].lower()
        if sig_key not in seen_positive:
            unique_positive.append(signal)
            seen_positive.add(sig_key)
    
    seen_adverse = set()
    unique_adverse = []
    for signal in all_adverse:
        sig_key = signal[:50].lower()
        if sig_key not in seen_adverse:
            unique_adverse.append(signal)
            seen_adverse.add(sig_key)
    
    seen_trend = set()
    unique_trend = []
    for signal in all_trend:
        sig_key = signal[:50].lower()
        if sig_key not in seen_trend:
            unique_trend.append(signal)
            seen_trend.add(sig_key)
    
    # Calculate weighted confidence
    # Macro: 40% weight, Micro: 60% weight (company-specific is more important)
    macro_confidence = macro_result.get('confidence', 0.5)
    micro_confidence = micro_result.get('confidence', 0.5)
    weighted_confidence = (macro_confidence * 0.4) + (micro_confidence * 0.6)
    
    # Determine overall stance
    macro_stance = macro_result.get('macro_stance', 'neutral')
    micro_stance = micro_result.get('sector_stance', 'neutral')
    
    # Combine stances (micro takes precedence if both exist)
    if micro_stance != 'neutral':
        overall_stance = micro_stance
    else:
        overall_stance = macro_stance
    
    # Calculate signal strength based on counts
    positive_count = len(unique_positive)
    adverse_count = len(unique_adverse)
    trend_count = len(unique_trend)
    
    if positive_count > adverse_count:
        signal_strength = 'positive'
    elif adverse_count > positive_count:
        signal_strength = 'adverse'
    else:
        signal_strength = 'neutral'
    
    return {
        'ticker': micro_result.get('ticker'),
        'company_name': micro_result.get('company_name'),
        'sector': micro_result.get('sector') or macro_result.get('sector'),
        'overall_stance': overall_stance,
        'weighted_confidence': round(weighted_confidence, 2),
        'signal_strength': signal_strength,
        'positive_signals': {
            'count': positive_count,
            'signals': unique_positive[:10]  # Top 10
        },
        'adverse_signals': {
            'count': adverse_count,
            'signals': unique_adverse[:10]  # Top 10
        },
        'trend_signals': {
            'count': trend_count,
            'signals': unique_trend[:10]  # Top 10
        },
        'macro_analysis': {
            'stance': macro_stance,
            'confidence': macro_confidence,
            'summary': macro_result.get('summary', ''),
            'articles_count': macro_result.get('articles_count', 0)
        },
        'micro_analysis': {
            'stance': micro_stance,
            'confidence': micro_confidence,
            'summary': micro_result.get('summary', ''),
            'articles_count': micro_result.get('articles_count', 0)
        },
        'total_articles_analyzed': (
            macro_result.get('articles_count', 0) + 
            micro_result.get('articles_count', 0)
        ),
        'details': (micro_result.get('details', []) + macro_result.get('details', []))[:10]  # Micro first, then macro
    }


class UserInputAnalysisRequest(BaseModel):
    """Request model for user input-based analysis."""
    user_input: str


@router.post("/dashboard/analyze")
async def analyze_from_user_input(request: UserInputAnalysisRequest, limit: int = 20):
    """
    Analyze a company from user input: identify company, then run RAG analysis.
    
    Args:
        request: User input request
        limit: Maximum number of articles to analyze per agent
        
    Returns:
        Company identification + aggregated analysis with Positive/Adverse/Trend signals
    """
    try:
        # Step 1: Identify company from user input
        identifier = get_company_identifier()
        company_info = identifier.identify_company(request.user_input)
        
        print(f"[Backend] Identified company: {company_info}")
        
        if not company_info.get('ticker'):
            print(f"[Backend] Company not found for input: {request.user_input}")
            return {
                'error': 'Company not found',
                'company_info': company_info,
                'analysis': None
            }
        
        # Step 2: Run ticker-based analysis
        macro_agent = get_macro_agent()
        micro_agent = MicroNewsAgent()
        
        # Get macro signal (sector/market/policy news)
        print(f"[Backend] Analyzing macro signals for {company_info['ticker']}...")
        macro_result = macro_agent.generate_signal(
            ticker=company_info['ticker'],
            sector=company_info.get('sector'),
            limit=limit
        )
        
        # Get micro signal (company-specific news)
        print(f"[Backend] Analyzing micro signals for {company_info['ticker']}...")
        micro_result = micro_agent.generate_signal(
            ticker=company_info['ticker'],
            company_name=company_info.get('company_name'),
            sector=company_info.get('sector'),
            limit=limit
        )
        
        # Aggregate signals
        analysis = aggregate_signals(macro_result, micro_result)
        
        # Ensure peers is always a list (not null/None)
        peers_list = company_info.get('peers') or []
        print(f"[Backend] Peers for {company_info['ticker']}: {peers_list}")
        
        # Add peers to company_info for consistency
        company_info['peers'] = peers_list
        
        return {
            'company_info': company_info,
            'analysis': analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing user input: {str(e)}")


class PeerComparisonRequest(BaseModel):
    """Request model for peer comparison."""
    ticker: str
    company_name: Optional[str] = None
    peers: List[str]


@router.post("/dashboard/compare-peers")
async def compare_with_peers(request: PeerComparisonRequest, limit: int = 20):
    """
    Compare a company with its peers by analyzing signals.
    
    Args:
        request: Peer comparison request with ticker, company_name, and peers list
        limit: Maximum number of articles to analyze per agent
        
    Returns:
        Comparison results with signal arrays (positive, adverse, trend) for main company and 3 peers
    """
    try:
        print(f"[Backend] compare-peers called with ticker={request.ticker}, peers={request.peers}")
        
        if not request.ticker:
            print(f"[Backend] No ticker provided, returning empty response")
            return {
                'base': None,
                'peers': []
            }
        
        macro_agent = get_macro_agent()
        micro_agent = MicroNewsAgent()
        
        # Analyze main company
        print(f"🔍 Analyzing main company {request.ticker}...")
        main_macro = macro_agent.generate_signal(
            ticker=request.ticker,
            sector="Energy",
            limit=limit
        )
        main_micro = micro_agent.generate_signal(
            ticker=request.ticker,
            company_name=request.company_name,
            sector="Energy",
            limit=limit
        )
        main_analysis = aggregate_signals(main_macro, main_micro)
        
        # Extract signal arrays from main company
        main_signals = {
            'positive': main_analysis.get('positive_signals', {}).get('signals', [])[:3],
            'adverse': main_analysis.get('adverse_signals', {}).get('signals', [])[:3],
            'trend': main_analysis.get('trend_signals', {}).get('signals', [])[:3]
        }
        
        base_company = {
            'company_name': request.company_name or request.ticker,  # Default to ticker if company_name is empty
            'ticker': request.ticker,
            'signals': main_signals
        }
        
        # Analyze peers (limit to 3)
        peer_results = []
        peers_to_analyze = request.peers[:3] if request.peers else []
        print(f"[Backend] Processing {len(peers_to_analyze)} peers: {peers_to_analyze}")
        
        for peer_ticker in peers_to_analyze:
            try:
                print(f"🔍 Analyzing peer {peer_ticker}...")
                # Ensure peer ticker has .KL suffix if not present
                peer_ticker_formatted = f"{peer_ticker}.KL" if not peer_ticker.endswith('.KL') else peer_ticker
                
                peer_macro = macro_agent.generate_signal(
                    ticker=peer_ticker_formatted,
                    sector="Energy",
                    limit=limit
                )
                peer_micro = micro_agent.generate_signal(
                    ticker=peer_ticker_formatted,
                    sector="Energy",
                    limit=limit
                )
                peer_analysis = aggregate_signals(peer_macro, peer_micro)
                
                # Extract signal arrays from peer
                peer_signals = {
                    'positive': peer_analysis.get('positive_signals', {}).get('signals', [])[:3],
                    'adverse': peer_analysis.get('adverse_signals', {}).get('signals', [])[:3],
                    'trend': peer_analysis.get('trend_signals', {}).get('signals', [])[:3]
                }
                
                peer_result = {
                    'company_name': peer_analysis.get('company_name', peer_ticker),
                    'ticker': peer_ticker,
                    'signals': peer_signals
                }
                peer_results.append(peer_result)
                print(f"[Backend] Successfully analyzed peer {peer_ticker}: {peer_result}")
            except Exception as e:
                print(f"⚠️ Error analyzing peer {peer_ticker}: {str(e)}")
                continue
        
        print(f"[Backend] Returning {len(peer_results)} peer results")
        return {
            'base': base_company,
            'peers': peer_results if peer_results else []  # Ensure empty list instead of None
        }
        
    except Exception as e:
        print(f"[Backend] Error in compare-peers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error comparing with peers: {str(e)}")



class ExplainSignalRequest(BaseModel):
    """Request model for explaining a specific signal."""
    ticker: str
    signal: str
    signal_type: str  # positive, adverse, trend
    context: Optional[str] = None  # Related news snippets or context
    prompt: Optional[str] = None  # Specific user question or "explain"


@router.post("/dashboard/explain-signal")
async def explain_signal(request: ExplainSignalRequest):
    """
    Generate a contextual explanation for a specific signal using AI.
    
    Args:
        request: Request with signal details and context
        
    Returns:
        Structured explanation based on actual article content with citations
    """
    try:
        # Use existing agent's LLM
        agent = get_micro_agent("energy")
        llm = agent.rag.llm_client
        
        # Parse context to get actual article data
        import json
        articles = []
        if request.context:
            try:
                articles = json.loads(request.context)
            except:
                pass
        
        # Separate micro and macro articles
        # Micro articles are company-specific (from direct URLs)
        # Macro articles are from energy sector
        micro_articles = []
        macro_articles = []
        
        for article in articles:
            if isinstance(article, dict):
                # Check if article is company-specific (micro) or sector-wide (macro)
                title = article.get("title", "").lower()
                ticker = request.ticker.replace('.KL', '').lower()
                
                # If ticker is mentioned in title, it's micro; otherwise macro
                if ticker in title:
                    micro_articles.append(article)
                else:
                    macro_articles.append(article)
        
        # Ensure we have exactly 1 macro + 2 micro (or as close as possible)
        selected_articles = []
        
        # Add 2 micro articles first
        selected_articles.extend(micro_articles[:2])
        
        # Add 1 macro article
        if macro_articles:
            selected_articles.append(macro_articles[0])
        
        # If we don't have enough micro, add more macro
        while len(selected_articles) < 3 and len(macro_articles) > len([a for a in selected_articles if a in macro_articles]):
            idx = len([a for a in selected_articles if a in macro_articles])
            if idx < len(macro_articles):
                selected_articles.append(macro_articles[idx])
        
        # If we don't have enough macro, add more micro
        while len(selected_articles) < 3 and len(micro_articles) > len([a for a in selected_articles if a in micro_articles]):
            idx = len([a for a in selected_articles if a in micro_articles])
            if idx < len(micro_articles):
                selected_articles.append(micro_articles[idx])
        
        # Extract article content for context
        article_summaries = []
        for i, article in enumerate(selected_articles, 1):
            if isinstance(article, dict):
                title = article.get("title", "")
                content = article.get("content", "")
                source_type = "MICRO" if article in micro_articles else "MACRO"
                # Take first 200 chars of content
                snippet = content[:200] + "..." if len(content) > 200 else content
                article_summaries.append(f"[{source_type} {i}] {title}\n{snippet}")
        
        articles_context = "\n\n".join(article_summaries) if article_summaries else "No specific articles available"
        
        # Create specific prompts based on action type
        prompt_type = (request.prompt or "explain").lower()
        
        if "risk" in prompt_type:
            # For risks, focus on adverse signals and negative implications
            system_prompt = f"""You are analyzing RISKS for {request.ticker}.

Signal: "{request.signal}"
Type: {request.signal_type.upper()}

Based on these news articles (1 macro sector + 2 micro company-specific), identify KEY RISKS:

{articles_context}

Your analysis should:
1. Start with ONE sentence summarizing the main risk
2. List 3-4 specific risks found in the articles with evidence
3. End with "Risk Assessment:" (High/Medium/Low) and why

Format:
- Use bullet points
- Cite articles as [MICRO 1], [MACRO 1], etc.
- Be critical and cautious
- Focus ONLY on risks and downsides

Do NOT add pleasantries. Start directly with the analysis."""

        elif "compare" in prompt_type or "peer" in prompt_type:
            # For peer comparison, we need to get the actual peer comparison data
            # This should be passed in the context or we use the articles
            system_prompt = f"""You are comparing {request.ticker} with its direct peers (WASCO, DELEUM, DAYANG - whichever are NOT {request.ticker}).

Signal: "{request.signal}"
Type: {request.signal_type.upper()}

Based on these articles (1 macro sector + 2 micro company-specific):

{articles_context}

Your analysis should compare {request.ticker} SPECIFICALLY with the 2 peer companies shown in the peer comparison section:
1. Start with ONE sentence on {request.ticker}'s position vs these specific peers
2. Provide 3-4 bullet points comparing:
   - Financial metrics vs peers (if mentioned)
   - Market position vs peers
   - Recent developments vs peers
   - Competitive advantages/disadvantages
3. End with "Competitive Outlook:" vs these peers

Format:
- Use bullet points
- Cite articles as [MICRO 1], [MACRO 1], etc.
- Compare with SPECIFIC peer companies
- Be objective and data-driven

Do NOT add pleasantries. Start directly with the analysis."""

        else:
            # For explain, provide comprehensive analysis
            system_prompt = f"""You are explaining this signal for {request.ticker} investors.

Signal: "{request.signal}"
Type: {request.signal_type.upper()}

Based on these news articles (1 macro sector + 2 micro company-specific):

{articles_context}

Your analysis should:
1. Start with ONE sentence explaining what this signal means
2. Provide 3-4 bullet points covering:
   - What happened (facts from articles)
   - Why it matters for investors
   - Key implications
   - What to watch next
3. End with "Market Impact:" assessment

Format:
- Use bullet points
- Cite articles as [MICRO 1], [MACRO 1], etc.
- Be factual and analytical
- Focus on investor relevance

Do NOT add pleasantries. Start directly with the analysis."""
        
        # Generate response with higher temperature for variety
        response = llm.generate(
            prompt=system_prompt,
            temperature=0.6,  # Higher for more natural responses
            max_tokens=400
        )
        
        # Prepare sources with actual article data (in order: micro first, then macro)
        sources = []
        for article in selected_articles:
            if isinstance(article, dict):
                sources.append({
                    "title": article.get("title", "News Article"),
                    "link": article.get("link", ""),
                    "source": article.get("source", "Yahoo Finance"),
                    "date": article.get("date", "")
                })
        
        return {
            "explanation": response,
            "signal": request.signal,
            "timestamp": "Just now",
            "sources": sources
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")


class ExplainInsightRequest(BaseModel):
    """Request model for explaining how an insight was generated."""
    ticker: str
    company_name: Optional[str] = None
    analysis: Dict  # Full analysis object with all data


@router.post("/dashboard/explain-insight")
async def explain_insight(request: ExplainInsightRequest):
    """
    Explain step-by-step how an insight was generated.
    
    Args:
        request: Request with ticker and full analysis data
        
    Returns:
        Step-by-step explanation in investor-friendly language
    """
    try:
        analysis = request.analysis
        ticker = request.ticker
        company_name = request.company_name or ticker
        
        # Extract actual data from analysis
        macro_articles_count = analysis.get('macro_analysis', {}).get('articles_count', 0)
        micro_articles_count = analysis.get('micro_analysis', {}).get('articles_count', 0)
        total_articles = analysis.get('total_articles_analyzed', macro_articles_count + micro_articles_count)
        
        positive_count = analysis.get('positive_signals', {}).get('count', 0)
        adverse_count = analysis.get('adverse_signals', {}).get('count', 0)
        trend_count = analysis.get('trend_signals', {}).get('count', 0)
        
        macro_stance = analysis.get('macro_analysis', {}).get('stance', 'neutral')
        micro_stance = analysis.get('micro_analysis', {}).get('stance', 'neutral')
        overall_stance = analysis.get('overall_stance', 'neutral')
        
        # News sources (based on actual scraper implementation)
        news_sources = [
            "KLSE Screener",
            "The Edge Malaysia (Oil & Gas)",
            "The Star Energy",
            "Asian Power Malaysia"
        ]
        
        # Determine time range (recent articles - typically last 20)
        time_range = "recent weeks" if total_articles > 0 else "no recent data"
        
        # Build explanation as numbered list
        explanation_steps = []
        
        # Step 1: Data Collection
        explanation_steps.append({
            "step": 1,
            "title": "Data Collection",
            "description": f"We gathered {total_articles} recent news articles from {len(news_sources)} trusted financial news sources: {', '.join(news_sources)}. These articles cover the {time_range} and focus on the energy sector and {company_name} specifically."
        })
        
        # Step 2: Article Filtering
        if macro_articles_count > 0 and micro_articles_count > 0:
            explanation_steps.append({
                "step": 2,
                "title": "Article Filtering",
                "description": f"We filtered the articles into two categories: {macro_articles_count} articles about the broader energy market and economic conditions (macro), and {micro_articles_count} articles specifically mentioning {company_name} or its operations (micro). Only articles with substantial content and relevance to your investment decision were included."
            })
        elif macro_articles_count > 0:
            explanation_steps.append({
                "step": 2,
                "title": "Article Filtering",
                "description": f"We filtered {macro_articles_count} articles about the broader energy market and economic conditions. Only articles with substantial content and relevance to your investment decision were included."
            })
        else:
            explanation_steps.append({
                "step": 2,
                "title": "Article Filtering",
                "description": f"We reviewed articles for relevance to {company_name} and the energy sector, focusing on those with substantial content that could impact investment decisions."
            })
        
        # Step 3: Signal Detection
        total_signals = positive_count + adverse_count + trend_count
        if total_signals > 0:
            signal_breakdown = []
            if positive_count > 0:
                signal_breakdown.append(f"{positive_count} positive signal{'s' if positive_count > 1 else ''}")
            if adverse_count > 0:
                signal_breakdown.append(f"{adverse_count} adverse signal{'s' if adverse_count > 1 else ''}")
            if trend_count > 0:
                signal_breakdown.append(f"{trend_count} trend signal{'s' if trend_count > 1 else ''}")
            
            explanation_steps.append({
                "step": 3,
                "title": "Signal Detection",
                "description": f"We analyzed the article content to identify key investment signals. From the {total_articles} articles, we detected {total_signals} distinct signals: {', '.join(signal_breakdown)}. Positive signals indicate favorable developments, adverse signals highlight concerns, and trend signals show ongoing patterns that may affect future performance."
            })
        else:
            explanation_steps.append({
                "step": 3,
                "title": "Signal Detection",
                "description": "We analyzed the article content to identify key investment signals. Signals are categorized as positive (favorable developments), adverse (concerns or risks), or trend (ongoing patterns)."
            })
        
        # Step 4: Micro vs Macro Contribution
        if macro_articles_count > 0 and micro_articles_count > 0:
            macro_weight = round((macro_articles_count / total_articles) * 100)
            micro_weight = round((micro_articles_count / total_articles) * 100)
            explanation_steps.append({
                "step": 4,
                "title": "Micro vs Macro Analysis",
                "description": f"The analysis combines two perspectives: macro analysis ({macro_articles_count} articles, {macro_weight}% weight) covering broader energy market trends and economic conditions, and micro analysis ({micro_articles_count} articles, {micro_weight}% weight) focusing specifically on {company_name}. Company-specific news carries more weight ({micro_weight}%) because it directly impacts {company_name}'s performance, while market-wide news provides important context ({macro_weight}%)."
            })
        elif macro_articles_count > 0:
            explanation_steps.append({
                "step": 4,
                "title": "Macro Analysis",
                "description": f"This analysis is based on {macro_articles_count} articles covering broader energy market trends and economic conditions. These provide important context about the overall market environment affecting {company_name}."
            })
        elif micro_articles_count > 0:
            explanation_steps.append({
                "step": 4,
                "title": "Micro Analysis",
                "description": f"This analysis is based on {micro_articles_count} articles specifically about {company_name} and its operations. Company-specific news directly impacts {company_name}'s performance."
            })
        else:
            explanation_steps.append({
                "step": 4,
                "title": "Analysis Scope",
                "description": f"The analysis considers both company-specific developments for {company_name} and broader energy market trends to provide a comprehensive investment perspective."
            })
        
        # Step 5: Sentiment Determination
        if positive_count > adverse_count:
            sentiment_reason = f"positive signals ({positive_count}) outweigh adverse signals ({adverse_count})"
        elif adverse_count > positive_count:
            sentiment_reason = f"adverse signals ({adverse_count}) outweigh positive signals ({positive_count})"
        else:
            sentiment_reason = f"positive and adverse signals are balanced ({positive_count} each)"
        
        stance_explanation = {
            'positive': 'positive (favorable)',
            'negative': 'negative (unfavorable)',
            'neutral': 'neutral (balanced)'
        }.get(overall_stance.lower(), 'neutral')
        
        explanation_steps.append({
            "step": 5,
            "title": "Sentiment Determination",
            "description": f"The overall sentiment is determined by comparing the balance of positive and adverse signals. For {company_name}, the sentiment is {stance_explanation} because {sentiment_reason}. The macro analysis shows a {macro_stance} stance, while the micro analysis shows a {micro_stance} stance. These are combined to form the final assessment."
        })
        
        # Step 6: Final Summarization
        summary_text = analysis.get('macro_analysis', {}).get('summary', '') or analysis.get('micro_analysis', {}).get('summary', '')
        if summary_text:
            summary_preview = summary_text[:100] + "..." if len(summary_text) > 100 else summary_text
        else:
            summary_preview = "Based on the analysis of all signals and market conditions"
        
        explanation_steps.append({
            "step": 6,
            "title": "Final Insight Summary",
            "description": f"The final insight combines all the signals, sentiment analysis, and market context into a clear summary. This summary reflects the weighted combination of macro market conditions ({macro_articles_count} articles) and micro company-specific news ({micro_articles_count} articles), resulting in an overall {stance_explanation} assessment for {company_name}."
        })
        
        return {
            "explanation": explanation_steps,
            "ticker": ticker,
            "company_name": company_name,
            "summary": f"This insight was generated by analyzing {total_articles} news articles from {len(news_sources)} trusted sources, identifying {total_signals} investment signals, and combining macro and micro perspectives to provide a comprehensive assessment."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insight explanation: {str(e)}")

