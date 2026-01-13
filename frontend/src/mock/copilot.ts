export interface Citation {
  label: string;
  url: string;
  snippet: string;
}

export interface CopilotResponse {
  answer: string;
  steps: string[];
  citations: Citation[];
}

export const mockCopilotResponses: Record<string, CopilotResponse> = {
  default: {
    answer: 'Based on the current news signals for this sector, I can help you understand the key trends and implications.',
    steps: [
      'Analyzed recent news articles and sentiment',
      'Identified key themes and topics',
      'Assessed overall sector sentiment'
    ],
    citations: [
      {
        label: 'Sector Analysis Report',
        url: 'https://example.com/reports/sector-analysis',
        snippet: 'Recent trends show mixed sentiment with positive earnings offset by regulatory concerns.'
      },
      {
        label: 'Market Intelligence',
        url: 'https://example.com/intelligence/market',
        snippet: 'Sector performance indicators suggest cautious optimism.'
      }
    ]
  },
  'what is the sentiment': {
    answer: 'The overall sentiment for this sector is mixed, with positive earnings news balanced by regulatory concerns.',
    steps: [
      'Aggregated sentiment scores from recent news',
      'Weighted by confidence and recency',
      'Calculated overall sentiment distribution'
    ],
    citations: [
      {
        label: 'Sentiment Analysis',
        url: 'https://example.com/sentiment/analysis',
        snippet: 'Positive: 45%, Neutral: 30%, Adverse: 25%'
      }
    ]
  },
  'top topics': {
    answer: 'The top topics currently driving news in this sector are Earnings, Regulation, and Contracts.',
    steps: [
      'Extracted topics from all news items',
      'Counted frequency and relevance',
      'Ranked by impact and recency'
    ],
    citations: [
      {
        label: 'Topic Analysis',
        url: 'https://example.com/topics/analysis',
        snippet: 'Earnings (35%), Regulation (25%), Contracts (20%)'
      }
    ]
  },
  'key risks': {
    answer: 'Key risks identified include regulatory changes, supply chain disruptions, and economic uncertainty.',
    steps: [
      'Analyzed adverse sentiment news',
      'Identified recurring risk themes',
      'Assessed potential impact'
    ],
    citations: [
      {
        label: 'Risk Assessment',
        url: 'https://example.com/risks/assessment',
        snippet: 'Regulatory scrutiny and compliance costs pose significant risks.'
      }
    ]
  }
};

export function getCopilotResponse(query: string): CopilotResponse {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('sentiment')) {
    return mockCopilotResponses['what is the sentiment'];
  }
  if (lowerQuery.includes('topic')) {
    return mockCopilotResponses['top topics'];
  }
  if (lowerQuery.includes('risk')) {
    return mockCopilotResponses['key risks'];
  }
  
  return mockCopilotResponses.default;
}
