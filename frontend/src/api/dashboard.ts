// API client for dashboard analysis

// Use relative path '/api' so it goes through Vite proxy to http://localhost:8000
const API_BASE_URL = '/api';

// --- Backend Shapes (Snake Case) ---
interface BackendSignalDetails {
  count: number;
  signals: string[];
}

interface BackendAnalysisSection {
  stance: 'positive' | 'negative' | 'neutral' | 'risk_on' | 'risk_off';
  confidence: number;
  summary: string;
  articles_count: number;
}

interface BackendDashboardAnalysis {
  ticker?: string;
  company_name?: string;
  sector?: string;
  overall_stance: 'positive' | 'negative' | 'neutral' | 'risk_on' | 'risk_off';
  weighted_confidence: number;
  signal_strength: 'positive' | 'adverse' | 'neutral';
  positive_signals: BackendSignalDetails;
  adverse_signals: BackendSignalDetails;
  trend_signals: BackendSignalDetails;
  macro_analysis: BackendAnalysisSection;
  micro_analysis: BackendAnalysisSection;
  total_articles_analyzed: number;
}

interface BackendDashboardResponse {
  company_info: {
    company_name: string;
    ticker?: string;
    sector?: string;
  };
  analysis: BackendDashboardAnalysis | null;
  error?: string;
}

// --- Frontend Shapes (Camel Case) ---
export interface SignalDetails {
  count: number;
  signals: string[];
}

export interface AnalysisSection {
  stance: string;
  confidence: number;
  summary: string;
  articlesCount: number;
}

export interface NormalizedDashboardAnalysis {
  overallStance: string;
  weightedConfidence: number;
  signalStrength: string;
  positiveSignals: SignalDetails;
  adverseSignals: SignalDetails;
  trendSignals: SignalDetails;
  macroAnalysis: AnalysisSection;
  microAnalysis: AnalysisSection;
  totalArticlesAnalyzed: number;
}

export interface DashboardResponse {
  companyInfo: {
    companyName: string;
    ticker?: string;
    sector?: string;
    peers?: string[];
  };
  analysis: NormalizedDashboardAnalysis | null;
  error?: string;
}

/**
 * Ping the API to check availability
 */
export async function debugApiPing(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.ok;
  } catch (error) {
    console.warn('[API Debug] Health check failed:', error);
    return false;
  }
}

/**
 * Analyze company from user input using the real backend API.
 * Maps snake_case backend response to camelCase frontend response.
 */
export async function analyzeUserInput(userInput: string): Promise<DashboardResponse> {
  const url = `${API_BASE_URL}/dashboard/analyze`;
  const payload = { user_input: userInput };

  console.log('[API] POST', url, payload);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = `API Error: ${errorJson.detail}`;
        }
      } catch (e) {
        if (errorText) errorMessage = `API Error: ${errorText}`; 
      }
      throw new Error(errorMessage);
    }

    const data: BackendDashboardResponse = await response.json();
    
    // Normalize logic
    // Normalize logic with strict null safety
    // Uses null coalescing to provide defaults if any nested field is missing
    const analysis = data?.analysis ? {
      overallStance: data.analysis?.overall_stance ?? 'neutral',
      weightedConfidence: data.analysis?.weighted_confidence ?? 0,
      signalStrength: data.analysis?.signal_strength ?? 'neutral',
      positiveSignals: {
        count: data.analysis?.positive_signals?.count ?? 0,
        signals: data.analysis?.positive_signals?.signals ?? []
      },
      adverseSignals: {
        count: data.analysis?.adverse_signals?.count ?? 0,
        signals: data.analysis?.adverse_signals?.signals ?? []
      },
      trendSignals: {
        count: data.analysis?.trend_signals?.count ?? 0,
        signals: data.analysis?.trend_signals?.signals ?? []
      },
      macroAnalysis: {
        stance: data.analysis?.macro_analysis?.stance ?? 'neutral',
        confidence: data.analysis?.macro_analysis?.confidence ?? 0,
        summary: data.analysis?.macro_analysis?.summary ?? '',
        articlesCount: data.analysis?.macro_analysis?.articles_count ?? 0
      },
      microAnalysis: {
        stance: data.analysis?.micro_analysis?.stance ?? 'neutral',
        confidence: data.analysis?.micro_analysis?.confidence ?? 0,
        summary: data.analysis?.micro_analysis?.summary ?? '',
        articlesCount: data.analysis?.micro_analysis?.articles_count ?? 0
      },
      totalArticlesAnalyzed: data.analysis?.total_articles_analyzed ?? 0
    } : null;

    return {
      companyInfo: {
        companyName: data.company_info.company_name,
        ticker: data.company_info.ticker,
        sector: data.company_info.sector
      },
      analysis,
      error: data.error
    };
    
  } catch (error: any) {
    console.error('[API ERROR] analyzeUserInput failed:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error: Could not reach backend server. Ensure it is running on port 8000.');
    }
    throw error;
  }
}

/**
 * Interface for Company Snapshot data
 */
export interface CompanySnapshot {
  name: string;
  code: string;
  sector: string;
  pe_ratio: number | null;
  dividend_yield: number | null;
  roe: number | null;
  market_cap: number | null;
  average_volume: number | null;
  annual_report_pdfs?: string[];
  detail_url?: string;
  peers?: string[];
}

export interface SearchCompanyResponse {
  status: string;
  company: CompanySnapshot;
}

/**
 * Search for a company on KLSE Screener by ticker/name.
 */
export async function searchCompany(ticker: string): Promise<CompanySnapshot | null> {
  // Construct URL with query param
  const url = `${API_BASE_URL}/company/search?company_name=${encodeURIComponent(ticker)}`;
  console.log('[API] GET', url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[API] Company not found: ${ticker}`);
        return null;
      }
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    const data: SearchCompanyResponse = await response.json();
    return data.company;
  } catch (error) {
    console.error('[API ERROR] searchCompany failed:', error);
    return null;
  }
}

// --- Peer Comparison Types ---
export interface SignalArrays {
  positive: string[];
  adverse: string[];
  trend: string[];
}

export interface CompanySignals {
  company_name: string;
  ticker: string;
  signals: SignalArrays;
}

export interface PeerComparisonResponse {
  base: CompanySignals | null;
  peers: CompanySignals[];
}

/**
 * Fetch peer comparison from backend
 * Slices peers to maximum 2 as per requirement
 */
export async function fetchPeerComparison(
  ticker: string,
  companyName: string | null | undefined,
  peers: string[]
): Promise<PeerComparisonResponse> {
  const url = `${API_BASE_URL}/dashboard/compare-peers`;
  const peersToSend = peers.slice(0, 2); // Slice to 2 peers per requirement

  const payload = {
    ticker,
    company_name: companyName || ticker,
    peers: peersToSend,
  };

  console.log('[API] POST', url, payload);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          errorMessage = `API Error: ${errorJson.detail}`;
        }
      } catch (e) {
        if (errorText) errorMessage = `API Error: ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data: PeerComparisonResponse = await response.json();
    console.log('[API] Peer comparison response:', data);

    return data;
  } catch (error: any) {
    console.error('[API ERROR] fetchPeerComparison failed:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Network error: Could not reach backend server. Ensure it is running on port 8000.');
    }
    throw error;
  }
}
