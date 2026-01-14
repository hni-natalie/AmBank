# Agents package
# Re-export functions from agents.py file to avoid import conflicts
import sys
import os
import importlib.util

# Import from parent agents.py file
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
agents_file_path = os.path.join(parent_dir, 'agents.py')

if os.path.exists(agents_file_path):
    spec = importlib.util.spec_from_file_location("agents_file", agents_file_path)
    agents_file_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(agents_file_module)
    
    # Re-export the functions
    get_macro_signal = agents_file_module.get_macro_signal
    clear_session_store = agents_file_module.clear_session_store
    get_sector_signal = agents_file_module.get_sector_signal
    get_bursa_signal = agents_file_module.get_bursa_signal
    SessionVectorStore = agents_file_module.SessionVectorStore
    get_session_store = agents_file_module.get_session_store
    
    # Export additional functions for routes.py
    get_klse_sector_companies = agents_file_module.get_klse_sector_companies
    analyze_company_query = agents_file_module.analyze_company_query
    _search_company_on_klse = agents_file_module._search_company_on_klse
    get_companies_by_sector_name = agents_file_module.get_companies_by_sector_name
    get_annual_report_pdfs = agents_file_module.get_annual_report_pdfs
    download_and_search_pdf = agents_file_module.download_and_search_pdf
else:
    # Fallback if agents.py doesn't exist
    from schemas.signals import MacroSignal
    def get_macro_signal(preferences: dict) -> MacroSignal:
        return MacroSignal(macro_stance="risk_on", confidence=0.72, summary="Stub")
    def clear_session_store():
        pass

