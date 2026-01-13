export type MacroStance = 'NEUTRAL' | 'POSITIVE' | 'CAUTIOUS';
export type Rating = 'BUY' | 'WATCH' | 'AVOID';
export type StepStatus = 'DONE' | 'PENDING' | 'IN_PROGRESS';

export interface EvidenceItem {
  label: string;
  title: string;
  date?: string;
  source?: string;
  url: string;
  snippet?: string;
  page?: number;
}

export interface CompanyEvidence {
  news: EvidenceItem[];
  filings: EvidenceItem[];
  annualReports: EvidenceItem[];
}

export interface FinalCompany {
  ticker: string;
  name: string;
  rating: Rating;
  score: number;
  breakdown: {
    fundamentals: number;
    news: number;
    riskPenalty: number;
  };
  rationale: string;
  flags: string[];
  watchlisted: boolean;
  evidence: CompanyEvidence;
}

export interface Step {
  key: string;
  label: string;
  status: StepStatus;
  detail: string;
  docCount: number;
}

export interface FinalListData {
  sector: string;
  macroStance: MacroStance;
  sectorSentimentScore: number;
  analyzedCount: number;
  finalCount: number;
  insights: string[];
  steps: Step[];
  companies: FinalCompany[];
}

export const mockFinalList: FinalListData = {
  sector: 'Technology',
  macroStance: 'POSITIVE',
  sectorSentimentScore: 72,
  analyzedCount: 28,
  finalCount: 5,
  insights: [
    'Macro environment favors tech sector with strong cloud adoption trends',
    'Sector shows resilience with positive earnings momentum across major players',
    'Regulatory risks remain but are manageable for established companies'
  ],
  steps: [
    {
      key: 'macro',
      label: 'Retrieve Macro news',
      status: 'DONE',
      detail: 'Collected 45 macro news items from trusted sources',
      docCount: 45
    },
    {
      key: 'sector',
      label: 'Retrieve Sector/Company news',
      status: 'DONE',
      detail: 'Analyzed 128 sector-specific news articles',
      docCount: 128
    },
    {
      key: 'universe',
      label: 'Select sector company universe from Bursa',
      status: 'DONE',
      detail: 'Identified 28 companies in Technology sector',
      docCount: 28
    },
    {
      key: 'parse',
      label: 'Parse annual reports (OCR/layout)',
      status: 'DONE',
      detail: 'Processed 28 annual reports with 95% accuracy',
      docCount: 28
    },
    {
      key: 'standardize',
      label: 'Standardize ratios + metrics',
      status: 'DONE',
      detail: 'Normalized financial ratios across all companies',
      docCount: 28
    },
    {
      key: 'combine',
      label: 'Combine signals + filter noise',
      status: 'DONE',
      detail: 'Applied ML filters to remove 23% noise from signals',
      docCount: 173
    },
    {
      key: 'rank',
      label: 'Rank companies + produce final list',
      status: 'DONE',
      detail: 'Generated ranked list of top 5 companies',
      docCount: 5
    }
  ],
  companies: [
    {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      rating: 'BUY',
      score: 87,
      breakdown: {
        fundamentals: 85,
        news: 90,
        riskPenalty: -8
      },
      rationale: 'Strong fundamentals with exceptional ROE and positive news sentiment, minimal risk flags',
      flags: [],
      watchlisted: false,
      evidence: {
        news: [
          {
            label: 'Q4 Earnings Report',
            title: 'Apple Reports Record Q4 Earnings',
            date: '2024-01-15',
            source: 'Bloomberg',
            url: 'https://example.com/news/aapl-q4',
            snippet: 'Strong iPhone sales and services growth drive record earnings'
          },
          {
            label: 'Product Launch',
            title: 'New iPhone Model Exceeds Expectations',
            date: '2024-01-10',
            source: 'TechCrunch',
            url: 'https://example.com/news/aapl-iphone',
            snippet: 'Consumer demand for latest iPhone model stronger than forecasted'
          }
        ],
        filings: [
          {
            label: 'Bursa Filing',
            title: 'Quarterly Financial Report',
            date: '2024-01-20',
            source: 'Bursa Malaysia',
            url: 'https://example.com/filings/aapl-q4',
            snippet: 'Revenue growth of 8.5% YoY reported'
          }
        ],
        annualReports: [
          {
            label: 'Annual Report 2023',
            title: 'Apple Inc. Annual Report',
            page: 45,
            url: 'https://example.com/reports/aapl-2023',
            snippet: 'Strong financial performance with ROE of 147.2%'
          }
        ]
      }
    },
    {
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      rating: 'BUY',
      score: 84,
      breakdown: {
        fundamentals: 88,
        news: 82,
        riskPenalty: -6
      },
      rationale: 'Excellent fundamentals with strong cloud growth, positive sentiment offset by minor regulatory concerns',
      flags: [],
      watchlisted: false,
      evidence: {
        news: [
          {
            label: 'Cloud Growth',
            title: 'Azure Revenue Surges 28%',
            date: '2024-01-12',
            source: 'Reuters',
            url: 'https://example.com/news/msft-azure',
            snippet: 'Cloud services continue to drive Microsoft growth'
          }
        ],
        filings: [
          {
            label: 'Bursa Filing',
            title: 'Quarterly Financial Report',
            date: '2024-01-18',
            source: 'Bursa Malaysia',
            url: 'https://example.com/filings/msft-q4',
            snippet: 'PAT margin improved to 36.7%'
          }
        ],
        annualReports: [
          {
            label: 'Annual Report 2023',
            title: 'Microsoft Corporation Annual Report',
            page: 32,
            url: 'https://example.com/reports/msft-2023',
            snippet: 'ROE of 38.9% with strong free cash flow'
          }
        ]
      }
    },
    {
      ticker: 'JPM',
      name: 'JPMorgan Chase & Co.',
      rating: 'WATCH',
      score: 72,
      breakdown: {
        fundamentals: 75,
        news: 70,
        riskPenalty: -13
      },
      rationale: 'Solid fundamentals but elevated risk from regulatory scrutiny and high debt levels',
      flags: ['High Debt', 'Regulatory Scrutiny'],
      watchlisted: false,
      evidence: {
        news: [
          {
            label: 'Earnings',
            title: 'JPMorgan Reports Strong Q4',
            date: '2024-01-14',
            source: 'Financial Times',
            url: 'https://example.com/news/jpm-q4',
            snippet: 'Net interest income increased 19%'
          }
        ],
        filings: [
          {
            label: 'Bursa Filing',
            title: 'Quarterly Financial Report',
            date: '2024-01-16',
            source: 'Bursa Malaysia',
            url: 'https://example.com/filings/jpm-q4',
            snippet: 'ROE of 18.5% with strong credit quality'
          }
        ],
        annualReports: [
          {
            label: 'Annual Report 2023',
            title: 'JPMorgan Chase Annual Report',
            page: 28,
            url: 'https://example.com/reports/jpm-2023',
            snippet: 'Strong performance across all business segments'
          }
        ]
      }
    },
    {
      ticker: 'WMT',
      name: 'Walmart Inc.',
      rating: 'WATCH',
      score: 68,
      breakdown: {
        fundamentals: 70,
        news: 65,
        riskPenalty: -7
      },
      rationale: 'Stable fundamentals with neutral sentiment, moderate growth prospects',
      flags: [],
      watchlisted: false,
      evidence: {
        news: [
          {
            label: 'Retail Sales',
            title: 'Walmart Holiday Sales Strong',
            date: '2024-01-13',
            source: 'CNBC',
            url: 'https://example.com/news/wmt-holiday',
            snippet: 'E-commerce growth accelerating'
          }
        ],
        filings: [
          {
            label: 'Bursa Filing',
            title: 'Quarterly Financial Report',
            date: '2024-01-17',
            source: 'Bursa Malaysia',
            url: 'https://example.com/filings/wmt-q4',
            snippet: 'Revenue growth of 5.2% YoY'
          }
        ],
        annualReports: [
          {
            label: 'Annual Report 2023',
            title: 'Walmart Inc. Annual Report',
            page: 15,
            url: 'https://example.com/reports/wmt-2023',
            snippet: 'Omnichannel strategy showing positive results'
          }
        ]
      }
    },
    {
      ticker: 'XOM',
      name: 'Exxon Mobil Corporation',
      rating: 'AVOID',
      score: 45,
      breakdown: {
        fundamentals: 50,
        news: 40,
        riskPenalty: -45
      },
      rationale: 'Weak fundamentals with adverse sentiment and profit warnings, high risk exposure',
      flags: ['Profit Warning', 'High Debt'],
      watchlisted: false,
      evidence: {
        news: [
          {
            label: 'Profit Warning',
            title: 'Exxon Warns of Lower Earnings',
            date: '2024-01-10',
            source: 'Bloomberg',
            url: 'https://example.com/news/xom-warning',
            snippet: 'Lower oil prices impacted upstream earnings'
          }
        ],
        filings: [
          {
            label: 'Bursa Filing',
            title: 'Quarterly Financial Report',
            date: '2024-01-15',
            source: 'Bursa Malaysia',
            url: 'https://example.com/filings/xom-q3',
            snippet: 'Revenue declined 12.5% YoY'
          }
        ],
        annualReports: [
          {
            label: 'Annual Report 2023',
            title: 'Exxon Mobil Annual Report',
            page: 22,
            url: 'https://example.com/reports/xom-2023',
            snippet: 'Challenging commodity environment'
          }
        ]
      }
    }
  ]
};
