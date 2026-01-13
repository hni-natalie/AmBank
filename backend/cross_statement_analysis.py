from dataclasses import dataclass
from typing import Dict, List, Optional


# =====================================================
# 1. NORMALIZED FINANCIAL DATA MODEL
# =====================================================

@dataclass
class FinancialSnapshot:
    # -----------------
    # Profit & Loss
    # -----------------
    revenue: float
    cogs: float
    ebitda: float
    net_profit: float
    interest_expense: float

    # -----------------
    # Balance Sheet
    # -----------------
    total_assets: float
    total_equity: float
    receivables: float
    inventory: float
    payables: float
    cash: float
    short_term_debt: float
    long_term_debt: float
    retained_earnings: float

    # -----------------
    # Cash Flow
    # -----------------
    operating_cash_flow: float
    capex: float
    free_cash_flow: float
    debt_repayment: float


# =====================================================
# 1A. HELPER FUNCTION TO CONVERT API RESPONSE
# =====================================================

def create_financial_snapshot_from_api(financial_metrics: Dict) -> Optional[FinancialSnapshot]:
    """
    Convert the output from /api/annual-reports/extract-financials endpoint
    to a FinancialSnapshot object.
    
    Args:
        financial_metrics: Dictionary containing extracted financial metrics from the API
        
    Returns:
        FinancialSnapshot object or None if required fields are missing
        
    Example:
        >>> api_response = {
        ...     "revenue": 1000000,
        ...     "cogs": 600000,
        ...     "ebitda": 200000,
        ...     # ... other fields
        ... }
        >>> snapshot = create_financial_snapshot_from_api(api_response)
    """
    try:
        # Helper to safely get float values, defaulting to 0.0 if None or missing
        def get_float(key: str, default: float = 0.0) -> float:
            value = financial_metrics.get(key)
            if value is None:
                return default
            try:
                return float(value)
            except (ValueError, TypeError):
                return default
        
        return FinancialSnapshot(
            # Profit & Loss
            revenue=get_float("revenue"),
            cogs=get_float("cogs"),
            ebitda=get_float("ebitda"),
            net_profit=get_float("net_profit"),
            interest_expense=get_float("interest_expense"),
            
            # Balance Sheet
            total_assets=get_float("total_assets"),
            total_equity=get_float("total_equity"),
            receivables=get_float("receivables"),
            inventory=get_float("inventory"),
            payables=get_float("payables"),
            cash=get_float("cash"),
            short_term_debt=get_float("short_term_debt"),
            long_term_debt=get_float("long_term_debt"),
            retained_earnings=get_float("retained_earnings"),
            
            # Cash Flow
            operating_cash_flow=get_float("operating_cash_flow"),
            capex=get_float("capex"),
            free_cash_flow=get_float("free_cash_flow"),
            debt_repayment=get_float("debt_repayment")
        )
    except Exception as e:
        print(f"Error creating FinancialSnapshot: {str(e)}")
        return None


# =====================================================
# 2. CORE METRIC CALCULATIONS
# =====================================================

def compute_metrics(
    curr: FinancialSnapshot,
    prev: Optional[FinancialSnapshot] = None
) -> Dict[str, Optional[float]]:

    metrics = {}

    # Margins
    metrics["gross_margin"] = (
        (curr.revenue - curr.cogs) / curr.revenue
        if curr.revenue else None
    )

    metrics["net_margin"] = (
        curr.net_profit / curr.revenue
        if curr.revenue else None
    )

    # Efficiency
    metrics["asset_turnover"] = (
        curr.revenue / curr.total_assets
        if curr.total_assets else None
    )

    # Leverage
    metrics["debt_to_equity"] = (
        (curr.short_term_debt + curr.long_term_debt) / curr.total_equity
        if curr.total_equity else None
    )

    # Debt coverage
    metrics["dscr"] = (
        curr.operating_cash_flow / curr.debt_repayment
        if curr.debt_repayment else None
    )

    # Growth metrics
    if prev:
        metrics["revenue_growth"] = (
            (curr.revenue - prev.revenue) / prev.revenue
            if prev.revenue else None
        )

        metrics["receivables_growth"] = (
            (curr.receivables - prev.receivables) / prev.receivables
            if prev.receivables else None
        )

        metrics["inventory_growth"] = (
            (curr.inventory - prev.inventory) / prev.inventory
            if prev.inventory else None
        )

    return metrics


# =====================================================
# 3. CROSS-STATEMENT ANALYSIS RULES
# =====================================================

def profitability_vs_cash(curr: FinancialSnapshot) -> List[Dict]:
    flags = []

    if curr.net_profit > 0 and curr.operating_cash_flow <= 0:
        flags.append({
            "severity": "high",
            "category": "Earnings Quality",
            "signal": "Profit not supported by cash flow",
            "insight": "Company is profitable but operating cash flow is weak or negative."
        })

    if curr.ebitda > 0 and curr.free_cash_flow <= 0:
        flags.append({
            "severity": "medium",
            "category": "Cash Burn",
            "signal": "EBITDA not converting to free cash flow",
            "insight": "Strong EBITDA but weak free cash flow indicates capex or working capital pressure."
        })

    return flags


def working_capital_dynamics(metrics: Dict) -> List[Dict]:
    flags = []

    rg = metrics.get("revenue_growth")
    recg = metrics.get("receivables_growth")
    invg = metrics.get("inventory_growth")

    if rg and recg and recg > rg * 1.5:
        flags.append({
            "severity": "high",
            "category": "Working Capital",
            "signal": "Receivables growing faster than revenue",
            "insight": "Sales growth is not translating into cash collection."
        })

    if rg and invg and invg > rg * 1.3:
        flags.append({
            "severity": "medium",
            "category": "Inventory Risk",
            "signal": "Inventory buildup",
            "insight": "Inventory growth is outpacing revenue growth."
        })

    return flags


def debt_and_coverage(curr: FinancialSnapshot, metrics: Dict) -> List[Dict]:
    flags = []

    dscr = metrics.get("dscr")
    dte = metrics.get("debt_to_equity")

    if dscr is not None and dscr < 1.2:
        flags.append({
            "severity": "high",
            "category": "Debt Risk",
            "signal": "Weak debt service coverage",
            "insight": "Operating cash flow may be insufficient to service debt."
        })

    if dte and dte > 1.5 and curr.net_profit <= 0:
        flags.append({
            "severity": "high",
            "category": "Leverage Risk",
            "signal": "High leverage without profit growth",
            "insight": "Debt is increasing without corresponding earnings support."
        })

    if curr.free_cash_flow < 0 and curr.short_term_debt > 0:
        flags.append({
            "severity": "high",
            "category": "Funding Risk",
            "signal": "Debt-funded operations",
            "insight": "Negative free cash flow while debt levels are rising."
        })

    return flags


def liquidity_stress(curr: FinancialSnapshot, prev: Optional[FinancialSnapshot]) -> List[Dict]:
    flags = []

    if prev and curr.cash < prev.cash and curr.net_profit > 0:
        flags.append({
            "severity": "medium",
            "category": "Liquidity",
            "signal": "Cash declining despite profits",
            "insight": "Cash leakage into working capital, capex, or debt servicing."
        })

    if curr.operating_cash_flow < 0:
        flags.append({
            "severity": "high",
            "category": "Liquidity",
            "signal": "Negative operating cash flow",
            "insight": "Core operations are consuming cash."
        })

    return flags


# =====================================================
# 4. MASTER ORCHESTRATOR
# =====================================================

def cross_statement_analysis(
    current: FinancialSnapshot,
    previous: Optional[FinancialSnapshot] = None
) -> Dict:

    metrics = compute_metrics(current, previous)

    flags = []
    flags += profitability_vs_cash(current)
    flags += working_capital_dynamics(metrics)
    flags += debt_and_coverage(current, metrics)
    flags += liquidity_stress(current, previous)

    risk_level = (
        "HIGH" if any(f["severity"] == "high" for f in flags)
        else "MEDIUM" if flags
        else "LOW"
    )

    return {
        "risk_level": risk_level,
        "metrics": metrics,
        "risk_flags": flags
    }
