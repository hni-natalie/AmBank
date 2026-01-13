import { NewsItem } from '../../mock/news';
import { NewsCard } from './NewsCard';
import styles from './MacroNewsPanel.module.css';

interface MacroNewsPanelProps {
  macroNews: NewsItem[];
  savedItems: Set<string>;
  onSave: (id: string) => void;
}

export function MacroNewsPanel({ macroNews, savedItems, onSave }: MacroNewsPanelProps) {
  if (macroNews.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Macro News</h2>
      <div className={styles.list}>
        {macroNews.map((news) => (
          <NewsCard
            key={news.id}
            news={news}
            onSave={onSave}
            isSaved={savedItems.has(news.id)}
          />
        ))}
      </div>
    </div>
  );
}
