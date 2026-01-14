import { Decision, Citation } from './resultJob';

export interface CompanySummary {
  ticker: string;
  name: string;
  sector?: string;
  decision: Decision;
  confidence: number;
  kpis: {
    roe: number;
    debtEquity: number;
    patMargin: number;
    currentRatio?: number;
    sentiment30d: number;
  };
  flags: string[];
  summaryEvidenceCitations: string[];
}

export interface ComparisonRow {
  key: string;
  label: string;
  a: CellValue;
  b: CellValue;
  c: CellValue;
  verdict?: 'A' | 'B' | 'C' | 'TIE';
  citations?: string[];
}

export type CellValue = string | number | { value: string | number; badge?: string };

export interface PeersComparison {
  jobId: string;
  target: CompanySummary;
  peers: [CompanySummary, CompanySummary];
  comparison: {
    rows: ComparisonRow[];
  };
  why: {
    whyChooseTarget: Array<{ text: string; citations: string[] }>;
    whyNotPeers: Array<{ text: string; citations: string[] }>;
  };
  citationsIndex: Record<string, Citation>;
}

const mockCitations: Record<string, Citation> = {
  'news_a1': {
    id: 'news_a1',
    type: 'NEWS',
    label: 'News #1',
    title: 'ABC Berhad Reports Strong Q3 Earnings',
    dateISO: '2024-01-15',
    source: 'The Edge Malaysia',
    url: 'https://example.com/news1',
    snippet: 'ABC Berhad announced a 15% increase in quarterly revenue, driven by strong performance in their technology division.'
  },
  'ar_a1': {
    id: 'ar_a1',
    type: 'AR',
    label: 'AR p.72',
    title: 'Annual Report 2023 - Financial Highlights',
    dateISO: '2023-12-31',
    source: 'ABC Berhad Annual Report',
    url: 'https://example.com/ar1',
    page: 72,
    snippet: 'The company maintained a strong ROE of 18.5% and reduced debt-to-equity ratio to 0.45.'
  },
  'news_b1': {
    id: 'news_b1',
    type: 'NEWS',
    label: 'News #1',
    title: 'XYZ Corporation Faces Regulatory Scrutiny',
    dateISO: '2024-01-10',
    source: 'Bloomberg',
    url: 'https://example.com/news_b1',
    snippet: 'XYZ Corporation is under regulatory scrutiny following concerns about financial reporting practices.'
  },
  'news_c1': {
    id: 'news_c1',
    type: 'NEWS',
    label: 'News #1',
    title: 'DEF Limited Shows Moderate Growth',
    dateISO: '2024-01-12',
    source: 'The Star',
    url: 'https://example.com/news_c1',
    snippet: 'DEF Limited reported moderate growth but faces challenges in maintaining profit margins.'
  }
};

export const mockPeersComparison: PeersComparison = {
  jobId: 'job_123',
  target: {
    ticker: 'ABC',
    name: 'ABC Berhad',
    sector: 'Technology',
    decision: 'CONNECT',
    confidence: 82,
    kpis: {
      roe: 18.5,
      debtEquity: 0.45,
      patMargin: 12.3,
      currentRatio: 1.8,
      sentiment30d: 75
    },
    flags: [],
    summaryEvidenceCitations: ['ar_a1', 'news_a1']
  },
  peers: [
    {
      ticker: 'XYZ',
      name: 'XYZ Corporation',
      sector: 'Technology',
      decision: 'CAUTION',
      confidence: 58,
      kpis: {
        roe: 12.2,
        debtEquity: 0.85,
        patMargin: 8.1,
        currentRatio: 1.2,
        sentiment30d: 45
      },
      flags: ['Regulatory Scrutiny', 'High Debt'],
      summaryEvidenceCitations: ['news_b1']
    },
    {
      ticker: 'DEF',
      name: 'DEF Limited',
      sector: 'Technology',
      decision: 'CAUTION',
      confidence: 65,
      kpis: {
        roe: 14.8,
        debtEquity: 0.62,
        patMargin: 9.5,
        currentRatio: 1.5,
        sentiment30d: 55
      },
      flags: ['Margin Pressure'],
      summaryEvidenceCitations: ['news_c1']
    }
  ],
  comparison: {
    rows: [
      {
        key: 'decision',
        label: 'Overall Decision',
        a: 'CONNECT',
        b: 'CAUTION',
        c: 'CAUTION',
        verdict: 'A',
        citations: ['ar_a1']
      },
      {
        key: 'confidence',
        label: 'Confidence',
        a: 82,
        b: 58,
        c: 65,
        verdict: 'A',
        citations: []
      },
      {
        key: 'roe',
        label: 'Profitability (ROE)',
        a: '18.5%',
        b: '12.2%',
        c: '14.8%',
        verdict: 'A',
        citations: ['ar_a1']
      },
      {
        key: 'debtEquity',
        label: 'Leverage (Debt/Equity)',
        a: '0.45',
        b: '0.85',
        c: '0.62',
        verdict: 'A',
        citations: ['ar_a1']
      },
      {
        key: 'currentRatio',
        label: 'Liquidity (Current Ratio)',
        a: '1.8',
        b: '1.2',
        c: '1.5',
        verdict: 'A',
        citations: []
      },
      {
        key: 'sentiment',
        label: 'News Sentiment (30d)',
        a: '75',
        b: '45',
        c: '55',
        verdict: 'A',
        citations: ['news_a1', 'news_b1', 'news_c1']
      },
      {
        key: 'flags',
        label: 'Red Flags',
        a: '0',
        b: '2',
        c: '1',
        verdict: 'A',
        citations: []
      },
      {
        key: 'latestEvent',
        label: 'Latest Major Event',
        a: 'Strong Q3 earnings',
        b: 'Regulatory scrutiny',
        c: 'Moderate growth',
        verdict: 'A',
        citations: ['news_a1', 'news_b1', 'news_c1']
      }
    ]
  },
  why: {
    whyChooseTarget: [
      {
        text: 'Superior financial metrics: ROE 18.5% vs peers 12-15%, lower debt ratio',
        citations: ['ar_a1']
      },
      {
        text: 'Strong positive sentiment (75/100) compared to peers (45-55)',
        citations: ['news_a1']
      },
      {
        text: 'No red flags identified, while peers have regulatory and margin concerns',
        citations: []
      },
      {
        text: 'Recent strong earnings performance indicates sustainable growth trajectory',
        citations: ['news_a1']
      }
    ],
    whyNotPeers: [
      {
        text: 'XYZ Corporation faces regulatory scrutiny and higher debt levels',
        citations: ['news_b1']
      },
      {
        text: 'DEF Limited shows margin pressure and lower profitability metrics',
        citations: ['news_c1']
      },
      {
        text: 'Both peers have lower confidence scores and weaker sentiment signals',
        citations: []
      }
    ]
  },
  citationsIndex: mockCitations
};

/**
 * Mock API function to get peers comparison
 * Simulates API call with latency
 */
export async function getPeersComparison(jobId: string): Promise<PeersComparison> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return mock data with the provided jobId
      resolve({
        ...mockPeersComparison,
        jobId
      });
    }, 1000); // Simulate 1s API latency
  });
}
