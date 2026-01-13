"""Peer comparison routes for news-based analysis."""
from fastapi import APIRouter, HTTPException
from agents.macro_news_agent import MacroNewsAgent
from agents.micro_news_agent import MicroNewsAgent
from typing import List, Dict, Optional
from pydantic import BaseModel

router = APIRouter()


class PeerComparisonRequest(BaseModel):
    """Request model for peer comparison."""
    ticker: str
    company_name: Optional[str] = None
    peers: List[str]


def aggregate_signals(macro_result: Dict, micro_result: Dict) -> Dict:
    """Aggregate macro and micro signals."""
    return {
        'positive_signals': {
            'count': len(macro_result.get('positive_signals', [])) + len(micro_result.get('positive_signals', [])),
            'signals': macro_result.get('positive_signals', []) + micro_result.get('positive_signals', [])
        },
        'adverse_signals': {
            'count': len(macro_result.get('adverse_signals', [])) + len(micro_result.get('adverse_signals', [])),
            'signals': macro_result.get('adverse_signals', []) + micro_result.get('adverse_signals', [])
        },
        'trend_signals': {
            'count': len(macro_result.get('trend_signals', [])) + len(micro_result.get('trend_signals', [])),
            'signals': macro_result.get('trend_signals', []) + micro_result.get('trend_signals', [])
        },
        'overall_stance': micro_result.get('stance', 'neutral')
    }


@router.post("/compare-peers")
async def compare_with_peers(request: PeerComparisonRequest, limit: int = 20):
    """
    Compare a company with its peers based on news signal analysis.
    
    Args:
        request: Peer comparison request with ticker, company_name, and peers list
        limit: Maximum number of articles to analyze per agent
        
    Returns:
        Comparison results with sentiments and percentages for main company and peers
    """
    try:
        macro_agent = MacroNewsAgent()
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
        
        # Analyze peers (limit to 2)
        peer_results = []
        peers_to_analyze = request.peers[:2] if request.peers else []
        
        for peer_ticker in peers_to_analyze:
            try:
                print(f"🔍 Analyzing peer {peer_ticker}...")
                peer_macro = macro_agent.generate_signal(
                    ticker=f"{peer_ticker}.KL",
                    sector="Energy",
                    limit=limit
                )
                peer_micro = micro_agent.generate_signal(
                    ticker=f"{peer_ticker}.KL",
                    sector="Energy",
                    limit=limit
                )
                peer_analysis = aggregate_signals(peer_macro, peer_micro)
                peer_results.append({
                    'ticker': peer_ticker,
                    'analysis': peer_analysis
                })
            except Exception as e:
                print(f"⚠️ Error analyzing peer {peer_ticker}: {str(e)}")
                continue
        
        # Calculate positive keyword counts and percentages
        positive_keywords = [
            'growth', 'supply', 'demand', 'increase', 'profit', 'gain', 
            'positive', 'strong', 'improve', 'rise', 'up',
            'capacity expansion', 'renewable adoption', 'solar', 'wind', 
            'efficiency', 'investment', 'grid upgrade', 'project award', 
            'production increase', 'output growth', 'sales growth'
        ]
        
        def count_positive_keywords_in_all_signals(analysis: Dict) -> int:
            """Count positive keywords across all signals (positive, adverse, trend)."""
            all_signals = (
                analysis.get('positive_signals', {}).get('signals', []) +
                analysis.get('adverse_signals', {}).get('signals', []) +
                analysis.get('trend_signals', {}).get('signals', [])
            )
            signals_text = ' '.join(all_signals).lower()
            count = 0
            for keyword in positive_keywords:
                if keyword in signals_text:
                    count += 1
            return count
        
        # Count positive keywords for main company (across all signals)
        main_positive_keyword_count = count_positive_keywords_in_all_signals(main_analysis)
        main_positive_signal_count = len(main_analysis.get('positive_signals', {}).get('signals', []))
        main_adverse_signal_count = len(main_analysis.get('adverse_signals', {}).get('signals', []))
        main_trend_signal_count = len(main_analysis.get('trend_signals', {}).get('signals', []))
        main_total_signals = main_positive_signal_count + main_adverse_signal_count + main_trend_signal_count
        
        # Calculate percentages based on signal counts (not keyword counts)
        main_positive_pct = (main_positive_signal_count / main_total_signals * 100) if main_total_signals > 0 else 0
        main_adverse_pct = (main_adverse_signal_count / main_total_signals * 100) if main_total_signals > 0 else 0
        main_trend_pct = (main_trend_signal_count / main_total_signals * 100) if main_total_signals > 0 else 0
        
        # Calculate for peers
        peer_comparisons = []
        for peer_result in peer_results:
            peer_analysis = peer_result['analysis']
            peer_positive_keyword_count = count_positive_keywords_in_all_signals(peer_analysis)
            peer_positive_signal_count = len(peer_analysis.get('positive_signals', {}).get('signals', []))
            peer_adverse_signal_count = len(peer_analysis.get('adverse_signals', {}).get('signals', []))
            peer_trend_signal_count = len(peer_analysis.get('trend_signals', {}).get('signals', []))
            peer_total_signals = peer_positive_signal_count + peer_adverse_signal_count + peer_trend_signal_count
            
            peer_positive_pct = (peer_positive_signal_count / peer_total_signals * 100) if peer_total_signals > 0 else 0
            peer_adverse_pct = (peer_adverse_signal_count / peer_total_signals * 100) if peer_total_signals > 0 else 0
            peer_trend_pct = (peer_trend_signal_count / peer_total_signals * 100) if peer_total_signals > 0 else 0
            
            peer_comparisons.append({
                'ticker': peer_result['ticker'],
                'positive_percentage': round(peer_positive_pct, 1),
                'adverse_percentage': round(peer_adverse_pct, 1),
                'trend_percentage': round(peer_trend_pct, 1),
                'overall_stance': peer_analysis.get('overall_stance', 'neutral')
            })
        
        return {
            'main_company': {
                'ticker': request.ticker,
                'company_name': request.company_name,
                'positive_percentage': round(main_positive_pct, 1),
                'adverse_percentage': round(main_adverse_pct, 1),
                'trend_percentage': round(main_trend_pct, 1),
                'overall_stance': main_analysis.get('overall_stance', 'neutral')
            },
            'peers': peer_comparisons
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing with peers: {str(e)}")
