export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'ADVERSE';

export interface Evidence {
  label: string;
  url: string;
  page?: number;
  snippet?: string;
}

export interface Company {
  ticker: string;
  name: string;
  sector: string;
  marketCap: number; // in millions
  revenueYoY: number; // percentage
  patMargin: number; // percentage
  roe: number; // percentage
  debtEquity: number; // ratio
  dividendYield: number; // percentage
  sentiment: Sentiment;
  flags: string[];
  ratiosTrend: {
    revenueYoY: number[];
    roe: number[];
    debtEquity: number[];
  };
  highlights: string[];
  evidence: Evidence[];
}

export const mockCompanies: Company[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    marketCap: 2800000,
    revenueYoY: 8.5,
    patMargin: 25.3,
    roe: 147.2,
    debtEquity: 1.73,
    dividendYield: 0.5,
    sentiment: 'POSITIVE',
    flags: [],
    ratiosTrend: {
      revenueYoY: [5.5, 6.2, 7.1, 8.5],
      roe: [140.1, 142.5, 145.8, 147.2],
      debtEquity: [1.65, 1.68, 1.71, 1.73]
    },
    highlights: [
      'Strong iPhone sales growth in emerging markets',
      'Services revenue reached record $22.3B in Q4',
      'Mac and iPad segments showing resilience',
      'Share buyback program of $90B announced'
    ],
    evidence: [
      {
        label: 'Annual Report 2023',
        url: 'https://example.com/reports/aapl-2023',
        page: 45,
        snippet: 'Revenue growth driven by strong product portfolio'
      },
      {
        label: 'Q4 Earnings Call',
        url: 'https://example.com/earnings/aapl-q4',
        snippet: 'Management optimistic about services segment'
      }
    ]
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    marketCap: 3100000,
    revenueYoY: 13.2,
    patMargin: 36.7,
    roe: 38.9,
    debtEquity: 0.45,
    dividendYield: 0.7,
    sentiment: 'POSITIVE',
    flags: [],
    ratiosTrend: {
      revenueYoY: [12.1, 12.8, 13.0, 13.2],
      roe: [37.2, 38.1, 38.5, 38.9],
      debtEquity: [0.42, 0.43, 0.44, 0.45]
    },
    highlights: [
      'Azure cloud revenue up 28% YoY',
      'Office 365 subscriber base exceeded 400M',
      'AI integration driving enterprise adoption',
      'Strong free cash flow generation'
    ],
    evidence: [
      {
        label: 'Annual Report 2023',
        url: 'https://example.com/reports/msft-2023',
        page: 32,
        snippet: 'Cloud services continue to be primary growth driver'
      }
    ]
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financial Services',
    marketCap: 450000,
    revenueYoY: 15.8,
    patMargin: 32.1,
    roe: 18.5,
    debtEquity: 2.1,
    dividendYield: 2.4,
    sentiment: 'POSITIVE',
    flags: [],
    ratiosTrend: {
      revenueYoY: [12.3, 14.1, 15.2, 15.8],
      roe: [17.2, 17.8, 18.2, 18.5],
      debtEquity: [2.05, 2.08, 2.09, 2.1]
    },
    highlights: [
      'Net interest income increased 19%',
      'Investment banking fees recovered',
      'Strong credit quality metrics',
      'Dividend increased by 5%'
    ],
    evidence: [
      {
        label: 'Annual Report 2023',
        url: 'https://example.com/reports/jpm-2023',
        page: 28,
        snippet: 'Strong performance across all business segments'
      }
    ]
  },
  {
    ticker: 'XOM',
    name: 'Exxon Mobil Corporation',
    sector: 'Energy',
    marketCap: 420000,
    revenueYoY: -12.5,
    patMargin: 8.9,
    roe: 25.3,
    debtEquity: 0.25,
    dividendYield: 3.8,
    sentiment: 'ADVERSE',
    flags: ['Profit Warning'],
    ratiosTrend: {
      revenueYoY: [-5.2, -8.1, -10.3, -12.5],
      roe: [28.5, 27.1, 26.2, 25.3],
      debtEquity: [0.22, 0.23, 0.24, 0.25]
    },
    highlights: [
      'Lower oil prices impacted upstream earnings',
      'Downstream margins compressed',
      'Capital discipline maintained',
      'Dividend sustainability under review'
    ],
    evidence: [
      {
        label: 'Q3 Earnings Report',
        url: 'https://example.com/reports/xom-q3',
        snippet: 'Management cited challenging commodity environment'
      }
    ]
  },
  {
    ticker: 'WMT',
    name: 'Walmart Inc.',
    sector: 'Consumer Products & Services',
    marketCap: 380000,
    revenueYoY: 5.2,
    patMargin: 2.8,
    roe: 22.1,
    debtEquity: 0.65,
    dividendYield: 1.5,
    sentiment: 'NEUTRAL',
    flags: [],
    ratiosTrend: {
      revenueYoY: [4.1, 4.6, 4.9, 5.2],
      roe: [21.2, 21.6, 21.9, 22.1],
      debtEquity: [0.62, 0.63, 0.64, 0.65]
    },
    highlights: [
      'E-commerce growth accelerating',
      'Supply chain efficiency improvements',
      'International operations stabilizing',
      'Focus on margin expansion'
    ],
    evidence: [
      {
        label: 'Annual Report 2023',
        url: 'https://example.com/reports/wmt-2023',
        page: 15,
        snippet: 'Omnichannel strategy showing positive results'
      }
    ]
  },
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    sector: 'Health Care',
    marketCap: 420000,
    revenueYoY: 6.8,
    patMargin: 20.5,
    roe: 28.7,
    debtEquity: 0.35,
    dividendYield: 3.1,
    sentiment: 'POSITIVE',
    flags: ['Litigation'],
    ratiosTrend: {
      revenueYoY: [5.2, 6.1, 6.5, 6.8],
      roe: [27.5, 28.1, 28.4, 28.7],
      debtEquity: [0.32, 0.33, 0.34, 0.35]
    },
    highlights: [
      'Pharmaceutical pipeline advancing',
      'Medical devices segment recovery',
      'Strong R&D investment',
      'Dividend aristocrat status maintained'
    ],
    evidence: [
      {
        label: 'Annual Report 2023',
        url: 'https://example.com/reports/jnj-2023',
        page: 52,
        snippet: 'Innovation pipeline supports long-term growth'
      }
    ]
  },
  {
    ticker: 'BAC',
    name: 'Bank of America Corp.',
    sector: 'Financial Services',
    marketCap: 280000,
    revenueYoY: 8.3,
    patMargin: 28.5,
    roe: 12.8,
    debtEquity: 1.95,
    dividendYield: 2.8,
    sentiment: 'NEUTRAL',
    flags: ['High Debt'],
    ratiosTrend: {
      revenueYoY: [6.5, 7.2, 7.8, 8.3],
      roe: [11.9, 12.3, 12.6, 12.8],
      debtEquity: [1.88, 1.91, 1.93, 1.95]
    },
    highlights: [
      'Consumer banking growth solid',
      'Trading revenue volatile',
      'Credit costs normalized',
      'Digital transformation progressing'
    ],
    evidence: [
      {
        label: 'Annual Report 2023',
        url: 'https://example.com/reports/bac-2023',
        page: 38,
        snippet: 'Balanced growth across business lines'
      }
    ]
  },
  {
    ticker: 'CVX',
    name: 'Chevron Corporation',
    sector: 'Energy',
    marketCap: 290000,
    revenueYoY: -8.2,
    patMargin: 9.2,
    roe: 18.5,
    debtEquity: 0.18,
    dividendYield: 4.2,
    sentiment: 'ADVERSE',
    flags: [],
    ratiosTrend: {
      revenueYoY: [-3.1, -5.5, -7.1, -8.2],
      roe: [20.1, 19.5, 19.0, 18.5],
      debtEquity: [0.15, 0.16, 0.17, 0.18]
    },
    highlights: [
      'Upstream production stable',
      'Downstream margins under pressure',
      'Capital allocation disciplined',
      'Dividend coverage strong'
    ],
    evidence: [
      {
        label: 'Q3 Earnings Report',
        url: 'https://example.com/reports/cvx-q3',
        snippet: 'Focus on operational efficiency'
      }
    ]
  }
];
