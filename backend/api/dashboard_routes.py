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
    
    Args:
        limit: Maximum number of articles per sector
        
    Returns:
        Dictionary of sector signals
    """
    sectors = ['technology', 'finance', 'healthcare', 'energy', 'consumer', 'industrial']
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
        )
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
        
        if not company_info.get('ticker'):
            return {
                'error': 'Company not found',
                'company_info': company_info,
                'analysis': None
            }
        
        # Step 2: Run ticker-based analysis
        macro_agent = get_macro_agent()
        micro_agent = MicroNewsAgent()
        
        # Get macro signal (sector/market/policy news)
        macro_result = macro_agent.generate_signal(
            ticker=company_info['ticker'],
            sector=company_info.get('sector'),
            limit=limit
        )
        
        # Get micro signal (company-specific news)
        micro_result = micro_agent.generate_signal(
            ticker=company_info['ticker'],
            company_name=company_info.get('company_name'),
            sector=company_info.get('sector'),
            limit=limit
        )
        
        # Aggregate signals
        analysis = aggregate_signals(macro_result, micro_result)
        
        return {
            'company_info': company_info,
            'analysis': analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing user input: {str(e)}")

