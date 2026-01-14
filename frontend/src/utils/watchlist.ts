export interface WatchlistItem {
  ticker: string;
  name: string;
  sector: string;
}

const WATCHLIST_KEY = 'watchlist';

export function loadWatchlist(): WatchlistItem[] {
  try {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading watchlist:', error);
  }
  return [];
}

export function saveWatchlist(watchlist: WatchlistItem[]): void {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.error('Error saving watchlist:', error);
  }
}

export function isWatchlisted(ticker: string, watchlist: WatchlistItem[]): boolean {
  return watchlist.some((item) => item.ticker === ticker);
}

export function addToWatchlist(
  item: WatchlistItem,
  watchlist: WatchlistItem[]
): WatchlistItem[] {
  // Check if already exists
  if (isWatchlisted(item.ticker, watchlist)) {
    return watchlist;
  }
  return [...watchlist, item];
}

export function removeFromWatchlist(
  ticker: string,
  watchlist: WatchlistItem[]
): WatchlistItem[] {
  return watchlist.filter((item) => item.ticker !== ticker);
}

export function toggleWatchlist(
  item: WatchlistItem,
  watchlist: WatchlistItem[]
): { updated: WatchlistItem[]; wasAdded: boolean } {
  if (isWatchlisted(item.ticker, watchlist)) {
    return {
      updated: removeFromWatchlist(item.ticker, watchlist),
      wasAdded: false
    };
  } else {
    return {
      updated: addToWatchlist(item, watchlist),
      wasAdded: true
    };
  }
}
