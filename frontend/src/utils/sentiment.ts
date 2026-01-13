export function getSentimentBadgeClass(sentiment: 'Positive' | 'Neutral' | 'Adverse'): string {
  const baseClass = 'sentiment-badge';
  switch (sentiment) {
    case 'Positive':
      return `${baseClass} sentiment-positive`;
    case 'Neutral':
      return `${baseClass} sentiment-neutral`;
    case 'Adverse':
      return `${baseClass} sentiment-adverse`;
    default:
      return `${baseClass} sentiment-neutral`;
  }
}
