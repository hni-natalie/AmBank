import styles from './FiltersBar.module.css';

interface FiltersBarProps {
  searchQuery: string;
  sentimentFilter: string;
  topicFilter: string;
  onSearchChange: (query: string) => void;
  onSentimentChange: (sentiment: string) => void;
  onTopicChange: (topic: string) => void;
  onClear: () => void;
}

const sentimentOptions = ['All', 'Positive', 'Neutral', 'Adverse'];
const topicOptions = ['All', 'Earnings', 'Litigation', 'Contracts', 'Management', 'Macro'];

export function FiltersBar({
  searchQuery,
  sentimentFilter,
  topicFilter,
  onSearchChange,
  onSentimentChange,
  onTopicChange,
  onClear
}: FiltersBarProps) {
  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search news..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label htmlFor="sentiment-filter" className={styles.label}>
            Sentiment
          </label>
          <select
            id="sentiment-filter"
            value={sentimentFilter}
            onChange={(e) => onSentimentChange(e.target.value)}
            className={styles.select}
          >
            {sentimentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="topic-filter" className={styles.label}>
            Topic
          </label>
          <select
            id="topic-filter"
            value={topicFilter}
            onChange={(e) => onTopicChange(e.target.value)}
            className={styles.select}
          >
            {topicOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Date Range</label>
          <div className={styles.datePlaceholder}>
            Coming soon
          </div>
        </div>

        <button onClick={onClear} className={styles.clearButton}>
          Clear
        </button>
      </div>
    </div>
  );
}
