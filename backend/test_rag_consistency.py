#!/usr/bin/env python3
"""Test script for RAG agent consistency.

Tests that the same ticker input produces consistent outputs across multiple runs.
"""

import sys
import os
from typing import Dict, List, Tuple, Optional
from collections import Counter

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from agents.macro_news_agent import MacroNewsAgent
from agents.micro_news_agent import MicroNewsAgent


# Global agent instances for caching
_macro_agent = None
_micro_agent = None


def rag_macro_news(ticker: str, limit: int = 10, persist: bool = True, db_path: Optional[str] = None) -> Dict:
    """
    Wrapper function for macro news RAG agent.
    
    Args:
        ticker: Stock ticker (e.g., "AMBANK.KL")
        limit: Maximum number of articles to analyze
        persist: Whether to persist vector database to disk
        db_path: Path to store vector database (auto-generated from ticker if None)
        
    Returns:
        Dictionary with Positive, Adverse, and Trend signals
    """
    global _macro_agent
    
    # Generate ticker-specific db_path if not provided
    if db_path is None:
        ticker_clean = ticker.replace('.', '_').replace('/', '_')
        db_path = f"./rag_db/macro_{ticker_clean}"
    
    # Create new agent with ticker-specific path if needed
    if _macro_agent is None or _macro_agent.db_path != db_path:
        _macro_agent = MacroNewsAgent(persist=persist, db_path=db_path)
    
    # Use cache for consistency testing
    result = _macro_agent.generate_signal(ticker=ticker, limit=limit, use_cache=True)
    
    # Extract and format signals
    return {
        "Positive": result.get('positive_signals', []),
        "Adverse": result.get('adverse_signals', []),
        "Trend": result.get('trend_signals', [])
    }


def rag_micro_news(ticker: str, limit: int = 10, persist: bool = True, db_path: Optional[str] = None) -> Dict:
    """
    Wrapper function for micro news RAG agent.
    
    Args:
        ticker: Stock ticker (e.g., "AMBANK.KL")
        limit: Maximum number of articles to analyze
        persist: Whether to persist vector database to disk
        db_path: Path to store vector database (auto-generated from ticker if None)
        
    Returns:
        Dictionary with Positive, Adverse, and Trend signals
    """
    global _micro_agent
    
    # Generate ticker-specific db_path if not provided
    if db_path is None:
        ticker_clean = ticker.replace('.', '_').replace('/', '_')
        db_path = f"./rag_db/micro_{ticker_clean}"
    
    # Create new agent with ticker-specific path if needed
    if _micro_agent is None or _micro_agent.db_path != db_path:
        _micro_agent = MicroNewsAgent(persist=persist, db_path=db_path)
    
    # Use cache for consistency testing
    result = _micro_agent.generate_signal(ticker=ticker, limit=limit, use_cache=True)
    
    # Extract and format signals
    return {
        "Positive": result.get('positive_signals', []),
        "Adverse": result.get('adverse_signals', []),
        "Trend": result.get('trend_signals', [])
    }


def normalize_signal(signal: str) -> str:
    """Normalize signal text for comparison (lowercase, strip whitespace)."""
    return signal.lower().strip()


def compare_signals(signals1: List[str], signals2: List[str]) -> Tuple[int, int]:
    """
    Compare two signal lists.
    
    Returns:
        Tuple of (matching_count, total_count)
    """
    # Treat empty lists as fully consistent
    if not signals1 and not signals2:
        return 1, 1  # Both empty = 100% match
    
    # Normalize signals
    norm1 = set(normalize_signal(s) for s in signals1)
    norm2 = set(normalize_signal(s) for s in signals2)
    
    # Count matches
    matches = len(norm1 & norm2)
    total = max(len(norm1), len(norm2)) if (norm1 or norm2) else 1
    
    return matches, total


def calculate_consistency(runs: List[Dict]) -> float:
    """
    Calculate consistency percentage across multiple runs.
    
    Args:
        runs: List of result dictionaries from multiple runs
        
    Returns:
        Consistency percentage (0.0 to 1.0)
    """
    if len(runs) < 2:
        return 1.0
    
    total_matches = 0
    total_comparisons = 0
    
    # Compare each run with the first run (baseline)
    baseline = runs[0]
    
    for run in runs[1:]:
        for signal_type in ["Positive", "Adverse", "Trend"]:
            matches, total = compare_signals(
                baseline.get(signal_type, []),
                run.get(signal_type, [])
            )
            total_matches += matches
            total_comparisons += total
    
    if total_comparisons == 0:
        return 1.0
    
    return total_matches / total_comparisons


def test_consistency(func, ticker: str, num_runs: int = 3, limit: int = 10) -> Tuple[List[Dict], float]:
    """
    Test consistency of a RAG function.
    
    Args:
        func: Function to test (rag_macro_news or rag_micro_news)
        ticker: Stock ticker to test
        num_runs: Number of times to run the function
        limit: Article limit for each run
        
    Returns:
        Tuple of (list of results, consistency percentage)
    """
    runs = []
    
    print(f"\n{'='*60}")
    print(f"Testing: {func.__name__}(ticker='{ticker}')")
    print(f"Runs: {num_runs}")
    print(f"{'='*60}\n")
    
    for i in range(num_runs):
        print(f"Run {i+1}/{num_runs}...", end=" ", flush=True)
        try:
            result = func(ticker, limit=limit)
            runs.append(result)
            print("✓")
            
            # Print signal counts
            pos_count = len(result.get("Positive", []))
            adv_count = len(result.get("Adverse", []))
            trend_count = len(result.get("Trend", []))
            print(f"  Signals: {pos_count} Positive, {adv_count} Adverse, {trend_count} Trend")
            
        except Exception as e:
            print(f"✗ Error: {str(e)}")
            runs.append({})
    
    # Calculate consistency
    consistency = calculate_consistency(runs)
    
    return runs, consistency


def print_detailed_comparison(runs: List[Dict]):
    """Print detailed comparison of runs."""
    if len(runs) < 2:
        return
    
    baseline = runs[0]
    
    print(f"\n{'─'*60}")
    print("Detailed Comparison (vs Run 1):")
    print(f"{'─'*60}")
    
    for signal_type in ["Positive", "Adverse", "Trend"]:
        print(f"\n{signal_type} Signals:")
        baseline_signals = baseline.get(signal_type, [])
        
        if not baseline_signals:
            print("  (No signals in baseline)")
            continue
        
        for i, run in enumerate(runs[1:], start=2):
            run_signals = run.get(signal_type, [])
            matches, total = compare_signals(baseline_signals, run_signals)
            similarity = (matches / total * 100) if total > 0 else 0
            
            print(f"  Run {i}: {matches}/{total} match ({similarity:.1f}%)")


def main():
    """Main test function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test RAG agent consistency")
    parser.add_argument("--ticker", type=str, default="WASCO.KL", help="Stock ticker to test (WASCO.KL, DELEUM.KL, DAYANG.KL, or KEYFIELD.KL)")
    parser.add_argument("--runs", type=int, default=3, help="Number of runs per function")
    parser.add_argument("--limit", type=int, default=10, help="Article limit per run")
    parser.add_argument("--detailed", action="store_true", help="Show detailed comparison")
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("RAG AGENT CONSISTENCY TEST")
    print("="*60)
    
    # Test macro news
    macro_runs, macro_consistency = test_consistency(
        rag_macro_news,
        args.ticker,
        num_runs=args.runs,
        limit=args.limit
    )
    
    # Test micro news
    micro_runs, micro_consistency = test_consistency(
        rag_micro_news,
        args.ticker,
        num_runs=args.runs,
        limit=args.limit
    )
    
    # Print summary
    print(f"\n{'='*60}")
    print("CONSISTENCY RESULTS")
    print(f"{'='*60}")
    print(f"\nMacro News Agent:  {macro_consistency*100:.1f}% consistent")
    print(f"Micro News Agent:  {micro_consistency*100:.1f}% consistent")
    print(f"\nOverall Average:   {(macro_consistency + micro_consistency)/2*100:.1f}% consistent")
    
    # Detailed comparison if requested
    if args.detailed:
        print_detailed_comparison(macro_runs)
        print_detailed_comparison(micro_runs)
    
    print(f"\n{'='*60}\n")


if __name__ == "__main__":
    main()

