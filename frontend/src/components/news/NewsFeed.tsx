import { NewsItem } from '../../mock/news';
import { NewsCard } from './NewsCard';
import styles from './NewsFeed.module.css';

interface NewsFeedProps {
  news: NewsItem[];
  savedItems: Set<string>;
  onSave: (id: string) => void;
}

export function NewsFeed({ news, savedItems, onSave }: NewsFeedProps) {
  if (news.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No news items found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Sector News Feed</h2>
      <div className={styles.list}>
        {news.map((item) => (
          <NewsCard
            key={item.id}
            news={item}
            onSave={onSave}
            isSaved={savedItems.has(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
