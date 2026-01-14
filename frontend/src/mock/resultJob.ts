export type Decision = 'CONNECT' | 'CAUTION' | 'AVOID';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'ADVERSE';
export type CitationType = 'NEWS' | 'BURSA' | 'AR';

export interface CitationRef {
  id: string;
  label: string;
}

export interface Citation {
  id: string;
  type: CitationType;
  label: string;
  title: string;
  dateISO?: string;
  source?: string;
  url: string;
  page?: number;
  snippet: string;
}

export interface ReasonItem {
  text: string;
  citations: CitationRef[];
}

export interface NewsSignal {
  id: string;
  title: string;
  dateISO: string;
  source: string;
  url: string;
  sentiment: Sentiment;
  topics: string[];
  rationale: string;
  entities: string[];
  citations: CitationRef[];
}

export interface FinancialRatios {
  roe: number;
  debtEquity: number;
  currentRatio: number;
  patMargin: number;
  revenueYoY: number;
  interestCoverage: number;
  trend?: {
    roe: number[];
    debtEquity: number[];
    patMargin: number[];
  };
}

export interface AssessmentResult {
  jobId: string;
  company: {
    name: string;
    ticker?: string;
    sector?: string;
  };
  decision: Decision;
  confidence: number;
  summary: string;
  flags: string[];
  reasonsYes: ReasonItem[];
  reasonsNo: ReasonItem[];
  ratios: FinancialRatios;
  newsSignals: NewsSignal[];
  citationsIndex: Record<string, Citation>;
}

const mockCitations: Record<string, Citation> = {
  'news_1': {
    id: 'news_1',
    type: 'NEWS',
    label: 'News #1',
    title: 'ABC Berhad Reports Strong Q3 Earnings',
    dateISO: '2024-01-15',
    source: 'The Edge Malaysia',
    url: 'https://example.com/news1',
    snippet: 'ABC Berhad announced a 15% increase in quarterly revenue, driven by strong performance in their technology division. The company also reported improved profit margins.'
  },
  'news_2': {
    id: 'news_2',
    type: 'NEWS',
    label: 'News #2',
    title: 'Market Analysts Upgrade ABC Berhad Rating',
    dateISO: '2024-01-20',
    source: 'Bloomberg',
    url: 'https://example.com/news2',
    snippet: 'Several analysts have upgraded their ratings for ABC Berhad following positive earnings guidance and strong market position.'
  },
  'bursa_1': {
    id: 'bursa_1',
    type: 'BURSA',
    label: 'Bursa #1',
    title: 'ABC Berhad - Material Transaction Announcement',
    dateISO: '2024-01-10',
    source: 'Bursa Malaysia',
    url: 'https://example.com/bursa1',
    snippet: 'ABC Berhad announced a material transaction involving the acquisition of a strategic technology asset, expected to enhance future revenue streams.'
  },
  'ar_1': {
    id: 'ar_1',
    type: 'AR',
    label: 'AR p.72',
    title: 'Annual Report 2023 - Financial Highlights',
    dateISO: '2023-12-31',
    source: 'ABC Berhad Annual Report',
    url: 'https://example.com/ar1',
    page: 72,
    snippet: 'The company maintained a strong ROE of 18.5% and reduced debt-to-equity ratio to 0.45, demonstrating improved financial health and operational efficiency.'
  },
  'ar_2': {
    id: 'ar_2',
    type: 'AR',
    label: 'AR p.45',
    title: 'Annual Report 2023 - Management Discussion',
    dateISO: '2023-12-31',
    source: 'ABC Berhad Annual Report',
    url: 'https://example.com/ar2',
    page: 45,
    snippet: 'Revenue growth of 12% year-over-year reflects successful expansion into new markets and strong customer retention rates.'
  },
  'news_3': {
    id: 'news_3',
    type: 'NEWS',
    label: 'News #3',
    title: 'Regulatory Concerns Raised Over ABC Berhad Operations',
    dateISO: '2024-01-05',
    source: 'The Star',
    url: 'https://example.com/news3',
    snippet: 'Regulatory authorities have raised concerns about certain operational practices, though no formal action has been taken yet.'
  }
};

export const mockAssessmentResult: AssessmentResult = {
  jobId: 'job_123',
  company: {
    name: 'ABC Berhad',
    ticker: 'ABC',
    sector: 'Technology'
  },
  decision: 'CONNECT',
  confidence: 82,
  summary: 'CONNECT — strong fundamentals + positive sentiment, no major red flags.',
  flags: [],
  reasonsYes: [
    {
      text: 'Strong financial ratios: ROE 18.5%, healthy debt-to-equity ratio of 0.45',
      citations: [{ id: 'ar_1', label: 'AR p.72' }]
    },
    {
      text: 'Positive earnings growth and analyst upgrades indicate market confidence',
      citations: [{ id: 'news_1', label: 'News #1' }, { id: 'news_2', label: 'News #2' }]
    },
    {
      text: 'Revenue growth of 12% YoY demonstrates successful expansion strategy',
      citations: [{ id: 'ar_2', label: 'AR p.45' }]
    },
    {
      text: 'Strategic acquisitions position company for future growth',
      citations: [{ id: 'bursa_1', label: 'Bursa #1' }]
    }
  ],
  reasonsNo: [
    {
      text: 'Minor regulatory concerns raised, though no formal action taken',
      citations: [{ id: 'news_3', label: 'News #3' }]
    }
  ],
  ratios: {
    roe: 18.5,
    debtEquity: 0.45,
    currentRatio: 1.8,
    patMargin: 12.3,
    revenueYoY: 12.0,
    interestCoverage: 8.5,
    trend: {
      roe: [16.2, 17.8, 18.5],
      debtEquity: [0.52, 0.48, 0.45],
      patMargin: [11.5, 11.9, 12.3]
    }
  },
  newsSignals: [
    {
      id: 'signal_1',
      title: 'ABC Berhad Reports Strong Q3 Earnings',
      dateISO: '2024-01-15',
      source: 'The Edge Malaysia',
      url: 'https://example.com/news1',
      sentiment: 'POSITIVE',
      topics: ['Earnings', 'Financial Performance'],
      rationale: 'Strong quarterly performance with 15% revenue increase and improved margins.',
      entities: ['ABC Berhad', 'Technology Division'],
      citations: [{ id: 'news_1', label: 'News #1' }]
    },
    {
      id: 'signal_2',
      title: 'Market Analysts Upgrade ABC Berhad Rating',
      dateISO: '2024-01-20',
      source: 'Bloomberg',
      url: 'https://example.com/news2',
      sentiment: 'POSITIVE',
      topics: ['Analyst Rating', 'Market Sentiment'],
      rationale: 'Multiple analysts upgraded ratings following positive earnings guidance.',
      entities: ['ABC Berhad', 'Analysts'],
      citations: [{ id: 'news_2', label: 'News #2' }]
    },
    {
      id: 'signal_3',
      title: 'Regulatory Concerns Raised Over ABC Berhad Operations',
      dateISO: '2024-01-05',
      source: 'The Star',
      url: 'https://example.com/news3',
      sentiment: 'ADVERSE',
      topics: ['Regulatory', 'Compliance'],
      rationale: 'Regulatory authorities raised concerns about operational practices, no formal action yet.',
      entities: ['ABC Berhad', 'Regulatory Authorities'],
      citations: [{ id: 'news_3', label: 'News #3' }]
    }
  ],
  citationsIndex: mockCitations
};

/**
 * Mock API function to get assessment result
 * Simulates API call with latency
 */
export async function getAssessmentResult(jobId: string): Promise<AssessmentResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return mock data with the provided jobId
      resolve({
        ...mockAssessmentResult,
        jobId
      });
    }, 1000); // Simulate 1s API latency
  });
}
