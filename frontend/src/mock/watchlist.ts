export interface WatchlistItem {
  ticker: string;
  name: string;
  sector: string;
  sentiment: 'Positive' | 'Neutral' | 'Adverse';
}

export const mockWatchlist: WatchlistItem[] = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Tech',
    sentiment: 'Positive'
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Banks',
    sentiment: 'Neutral'
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Tech',
    sentiment: 'Positive'
  },
  {
    ticker: 'WMT',
    name: 'Walmart Inc.',
    sector: 'Consumer',
    sentiment: 'Neutral'
  },
  {
    ticker: 'XOM',
    name: 'Exxon Mobil Corporation',
    sector: 'Energy',
    sentiment: 'Adverse'
  }
];
