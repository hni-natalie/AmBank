"""
Example usage of the Financial Risk Analysis endpoints
"""

# Example 1: Extract financials and map to FinancialSnapshot
# ===========================================================

# Sample API response from /api/annual-reports/extract-financials
sample_api_response = {
    "status": "success",
    "total_pdfs": 1,
    "processed": 1,
    "results": [
        {
            "status": "success",
            "financial_metrics": {
                # P&L
                "revenue": 5000000000,
                "cogs": 3000000000,
                "gross_profit": 2000000000,
                "ebitda": 800000000,
                "net_profit": 500000000,
                "interest_expense": 50000000,
                
                # Balance Sheet
                "total_assets": 10000000000,
                "total_equity": 6000000000,
                "receivables": 1000000000,
                "inventory": 800000000,
                "payables": 600000000,
                "cash": 500000000,
                "short_term_debt": 1000000000,
                "long_term_debt": 2000000000,
                "retained_earnings": 3000000000,
                
                # Cash Flow
                "operating_cash_flow": 600000000,
                "capex": 300000000,
                "free_cash_flow": 300000000,
                "debt_repayment": 200000000
            }
        }
    ]
}

# Convert to FinancialSnapshot
from cross_statement_analysis import create_financial_snapshot_from_api

financial_metrics = sample_api_response["results"][0]["financial_metrics"]
snapshot = create_financial_snapshot_from_api(financial_metrics)

print("✓ Created FinancialSnapshot:")
print(f"  Revenue: {snapshot.revenue:,.0f}")
print(f"  Net Profit: {snapshot.net_profit:,.0f}")
print(f"  Total Assets: {snapshot.total_assets:,.0f}")
print(f"  Operating Cash Flow: {snapshot.operating_cash_flow:,.0f}")


# Example 2: Perform cross-statement analysis
# ============================================

from cross_statement_analysis import cross_statement_analysis

# Analyze single period
analysis = cross_statement_analysis(current=snapshot, previous=None)

print(f"\n✓ Risk Analysis:")
print(f"  Risk Level: {analysis['risk_level']}")
print(f"  Total Flags: {len(analysis['risk_flags'])}")

if analysis['risk_flags']:
    print(f"\n  Risk Flags:")
    for flag in analysis['risk_flags']:
        print(f"    - [{flag['severity'].upper()}] {flag['signal']}")
        print(f"      {flag['insight']}")


# Example 3: Compare two periods
# ===============================

# Previous year data
previous_metrics = {
    "revenue": 4500000000,
    "cogs": 2800000000,
    "ebitda": 700000000,
    "net_profit": 450000000,
    "interest_expense": 45000000,
    "total_assets": 9500000000,
    "total_equity": 5500000000,
    "receivables": 800000000,
    "inventory": 700000000,
    "payables": 550000000,
    "cash": 600000000,
    "short_term_debt": 900000000,
    "long_term_debt": 2200000000,
    "retained_earnings": 2800000000,
    "operating_cash_flow": 550000000,
    "capex": 280000000,
    "free_cash_flow": 270000000,
    "debt_repayment": 180000000
}

previous_snapshot = create_financial_snapshot_from_api(previous_metrics)

# Analyze with comparison
comparative_analysis = cross_statement_analysis(
    current=snapshot,
    previous=previous_snapshot
)

print(f"\n✓ Comparative Risk Analysis:")
print(f"  Risk Level: {comparative_analysis['risk_level']}")
print(f"\n  Key Metrics:")
for key, value in comparative_analysis['metrics'].items():
    if value is not None:
        if 'growth' in key or 'margin' in key:
            print(f"    {key}: {value:.2%}")
        else:
            print(f"    {key}: {value:.3f}")


# Example 4: Using the new API endpoint
# ======================================

"""
# Call the new risk analysis endpoint:
POST /api/annual-reports/risk-analysis

Request:
{
    "ar": [
        "https://disclosure.bursamalaysia.com/.../report_2024.pdf",
        "https://disclosure.bursamalaysia.com/.../report_2023.pdf"
    ]
}

Response:
{
    "status": "success",
    "total_pdfs": 2,
    "snapshots_created": 2,
    "financial_data": {
        "current": { ... extracted metrics ... },
        "previous": { ... extracted metrics ... }
    },
    "risk_analysis": {
        "risk_level": "MEDIUM",
        "metrics": {
            "gross_margin": 0.40,
            "net_margin": 0.10,
            "asset_turnover": 0.50,
            "debt_to_equity": 0.50,
            "dscr": 3.0,
            "revenue_growth": 0.111,
            "receivables_growth": 0.25,
            "inventory_growth": 0.143
        },
        "risk_flags": [
            {
                "severity": "high",
                "category": "Working Capital",
                "signal": "Receivables growing faster than revenue",
                "insight": "Sales growth is not translating into cash collection."
            }
        ]
    },
    "interpretation": {
        "risk_level": "MEDIUM",
        "total_flags": 1,
        "high_severity_flags": 1,
        "categories_affected": ["Working Capital"]
    }
}
"""
