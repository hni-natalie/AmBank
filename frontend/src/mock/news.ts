export type NewsType = 'MACRO' | 'SECTOR';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'ADVERSE';

export interface NewsItem {
  id: string;
  type: NewsType;
  title: string;
  source: string;
  dateISO: string;
  url: string;
  sentiment: Sentiment;
  topics: string[];
  rationale: string;
  entities: string[];
  confidence: number;
  clusterId?: string;
  sector?: string;
}

export const mockNews: NewsItem[] = [
  // Macro news
  {
    id: 'm1',
    type: 'MACRO',
    title: 'Federal Reserve Holds Interest Rates Steady Amid Economic Uncertainty',
    source: 'Bloomberg',
    dateISO: '2024-01-15T10:00:00Z',
    url: 'https://example.com/news/m1',
    sentiment: 'NEUTRAL',
    topics: ['Macro', 'Monetary Policy'],
    rationale: 'The Fed maintained rates at current levels, signaling cautious approach to inflation while monitoring labor market conditions.',
    entities: ['Federal Reserve', 'US Economy'],
    confidence: 0.85,
    sector: 'Banks'
  },
  {
    id: 'm2',
    type: 'MACRO',
    title: 'GDP Growth Exceeds Expectations in Q4 2023',
    source: 'Reuters',
    dateISO: '2024-01-12T14:30:00Z',
    url: 'https://example.com/news/m2',
    sentiment: 'POSITIVE',
    topics: ['Macro', 'Economic Growth'],
    rationale: 'Strong consumer spending and business investment drove GDP growth above analyst forecasts, indicating resilient economy.',
    entities: ['US GDP', 'Consumer Spending'],
    confidence: 0.92,
    sector: 'Consumer'
  },
  {
    id: 'm3',
    type: 'MACRO',
    title: 'Inflation Data Shows Moderation in Core Prices',
    source: 'WSJ',
    dateISO: '2024-01-10T09:15:00Z',
    url: 'https://example.com/news/m3',
    sentiment: 'POSITIVE',
    topics: ['Macro', 'Inflation'],
    rationale: 'Core inflation slowed more than expected, providing relief to markets and suggesting Fed policy effectiveness.',
    entities: ['CPI', 'Federal Reserve'],
    confidence: 0.88,
    sector: 'Tech'
  },
  // Sector news - Tech
  {
    id: 't1',
    type: 'SECTOR',
    title: 'Tech Giants Report Strong Cloud Revenue Growth',
    source: 'TechCrunch',
    dateISO: '2024-01-14T16:20:00Z',
    url: 'https://example.com/news/t1',
    sentiment: 'POSITIVE',
    topics: ['Earnings', 'Cloud Services'],
    rationale: 'Major tech companies show accelerating cloud adoption, with revenue growth exceeding 20% YoY across the sector.',
    entities: ['Microsoft', 'Amazon', 'Google'],
    confidence: 0.90,
    clusterId: 'cloud-1',
    sector: 'Tech'
  },
  {
    id: 't2',
    type: 'SECTOR',
    title: 'AI Regulation Bill Advances in Congress',
    source: 'The Verge',
    dateISO: '2024-01-13T11:45:00Z',
    url: 'https://example.com/news/t2',
    sentiment: 'ADVERSE',
    topics: ['Litigation', 'Regulation'],
    rationale: 'Proposed AI regulation could impose compliance costs and limit innovation for tech companies developing AI products.',
    entities: ['Congress', 'AI Companies'],
    confidence: 0.75,
    sector: 'Tech'
  },
  {
    id: 't3',
    type: 'SECTOR',
    title: 'Tech Sector Layoffs Continue into 2024',
    source: 'CNBC',
    dateISO: '2024-01-11T08:30:00Z',
    url: 'https://example.com/news/t3',
    sentiment: 'ADVERSE',
    topics: ['Management', 'Cost Cutting'],
    rationale: 'Several major tech companies announce workforce reductions as they adjust to slower growth and focus on profitability.',
    entities: ['Tech Companies', 'Workforce'],
    confidence: 0.82,
    sector: 'Tech'
  },
  {
    id: 't4',
    type: 'SECTOR',
    title: 'New Chip Manufacturing Partnership Announced',
    source: 'Bloomberg',
    dateISO: '2024-01-09T13:00:00Z',
    url: 'https://example.com/news/t4',
    sentiment: 'POSITIVE',
    topics: ['Contracts', 'Manufacturing'],
    rationale: 'Strategic partnership between chip makers expected to boost supply chain resilience and reduce dependency on single suppliers.',
    entities: ['TSMC', 'Intel', 'Samsung'],
    confidence: 0.87,
    clusterId: 'chips-1',
    sector: 'Tech'
  },
  // Sector news - Banks
  {
    id: 'b1',
    type: 'SECTOR',
    title: 'Major Banks Report Strong Q4 Earnings',
    source: 'Financial Times',
    dateISO: '2024-01-14T07:00:00Z',
    url: 'https://example.com/news/b1',
    sentiment: 'POSITIVE',
    topics: ['Earnings', 'Profitability'],
    rationale: 'Net interest income growth and lower credit losses drive better-than-expected quarterly results across major banks.',
    entities: ['JPMorgan', 'Bank of America', 'Wells Fargo'],
    confidence: 0.91,
    sector: 'Banks'
  },
  {
    id: 'b2',
    type: 'SECTOR',
    title: 'Regulatory Scrutiny Increases on Bank Lending Practices',
    source: 'Reuters',
    dateISO: '2024-01-12T10:15:00Z',
    url: 'https://example.com/news/b2',
    sentiment: 'ADVERSE',
    topics: ['Litigation', 'Regulation'],
    rationale: 'Regulators announce enhanced oversight of commercial lending, potentially requiring additional capital reserves.',
    entities: ['FDIC', 'Federal Reserve', 'Banks'],
    confidence: 0.78,
    sector: 'Banks'
  },
  {
    id: 'b3',
    type: 'SECTOR',
    title: 'Bank Merger Deal Valued at $5B Announced',
    source: 'WSJ',
    dateISO: '2024-01-08T15:30:00Z',
    url: 'https://example.com/news/b3',
    sentiment: 'POSITIVE',
    topics: ['Contracts', 'M&A'],
    rationale: 'Regional bank consolidation continues as two mid-size banks announce merger to create stronger competitive position.',
    entities: ['Regional Banks'],
    confidence: 0.85,
    sector: 'Banks'
  },
  // Sector news - Consumer
  {
    id: 'c1',
    type: 'SECTOR',
    title: 'Retail Sales Surge During Holiday Season',
    source: 'CNBC',
    dateISO: '2024-01-13T09:00:00Z',
    url: 'https://example.com/news/c1',
    sentiment: 'POSITIVE',
    topics: ['Earnings', 'Consumer Spending'],
    rationale: 'Holiday retail sales exceed expectations, driven by strong consumer confidence and promotional activity.',
    entities: ['Retailers', 'Consumer'],
    confidence: 0.89,
    sector: 'Consumer'
  },
  {
    id: 'c2',
    type: 'SECTOR',
    title: 'Supply Chain Disruptions Impact Consumer Goods',
    source: 'Bloomberg',
    dateISO: '2024-01-10T12:00:00Z',
    url: 'https://example.com/news/c2',
    sentiment: 'ADVERSE',
    topics: ['Management', 'Supply Chain'],
    rationale: 'Ongoing logistics challenges continue to affect inventory levels and margins for consumer goods companies.',
    entities: ['Consumer Goods', 'Supply Chain'],
    confidence: 0.80,
    sector: 'Consumer'
  }
];
