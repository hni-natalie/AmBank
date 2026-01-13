import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NewsLayout } from '../components/news/NewsLayout';
import { MacroNewsPanel } from '../components/news/MacroNewsPanel';
import { FiltersBar } from '../components/news/FiltersBar';
import { NewsFeed } from '../components/news/NewsFeed';
import { CopilotWidget } from '../components/copilot/CopilotWidget';
import { mockNews, Sentiment } from '../mock/news';
import styles from './NewsPage.module.css';

export function NewsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const sector = searchParams.get('sector') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string>('');

  const filteredNews = useMemo(() => {
    let filtered = mockNews.filter((news) => {
      // Filter by sector
      if (sector && news.sector) {
        const newsSector = news.sector.toLowerCase();
        const selectedSector = sector.toLowerCase();
        if (newsSector !== selectedSector) {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = news.title.toLowerCase().includes(query);
        const matchesRationale = news.rationale.toLowerCase().includes(query);
        if (!matchesTitle && !matchesRationale) {
          return false;
        }
      }

      // Filter by sentiment
      if (sentimentFilter !== 'All') {
        const sentimentMap: Record<string, Sentiment> = {
          'Positive': 'POSITIVE',
          'Neutral': 'NEUTRAL',
          'Adverse': 'ADVERSE'
        };
        if (news.sentiment !== sentimentMap[sentimentFilter]) {
          return false;
        }
      }

      // Filter by topic
      if (topicFilter !== 'All') {
        if (!news.topics.some((topic) => topic.toLowerCase() === topicFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // Separate macro and sector news
    const macro = filtered.filter((n) => n.type === 'MACRO');
    const sectorNews = filtered.filter((n) => n.type === 'SECTOR');

    return { macro, sector: sectorNews };
  }, [sector, searchQuery, sentimentFilter, topicFilter]);

  const handleSave = (id: string) => {
    setSavedItems((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    setToastMessage('Saved to watchlist');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSentimentFilter('All');
    setTopicFilter('All');
  };

  // Calculate sentiment breakdown
  const sentimentBreakdown = useMemo(() => {
    const allNews = [...filteredNews.macro, ...filteredNews.sector];
    const breakdown = {
      Positive: 0,
      Neutral: 0,
      Adverse: 0
    };

    allNews.forEach((news) => {
      const sentimentMap: Record<Sentiment, keyof typeof breakdown> = {
        POSITIVE: 'Positive',
        NEUTRAL: 'Neutral',
        ADVERSE: 'Adverse'
      };
      breakdown[sentimentMap[news.sentiment]]++;
    });

    return breakdown;
  }, [filteredNews]);

  // Get top topics
  const topTopics = useMemo(() => {
    const allNews = [...filteredNews.macro, ...filteredNews.sector];
    const topicCounts: Record<string, number> = {};

    allNews.forEach((news) => {
      news.topics.forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }, [filteredNews]);

  if (!sector) {
    return (
      <div className={styles.emptyState}>
        <h2>No Sector Selected</h2>
        <p>Please select a sector from the homepage to view news.</p>
        <button onClick={() => navigate('/')} className={styles.homeButton}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Sector News & Signals</h1>
          <p className={styles.subtitle}>Sector: {sector}</p>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            Back to Home
          </button>
          <button
            onClick={() => navigate(`/final?sector=${encodeURIComponent(sector)}`)}
            className={styles.finalListButton}
          >
            View Final List
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <NewsLayout
          leftColumn={
            <>
              <MacroNewsPanel
                macroNews={filteredNews.macro}
                savedItems={savedItems}
                onSave={handleSave}
              />
              <FiltersBar
                searchQuery={searchQuery}
                sentimentFilter={sentimentFilter}
                topicFilter={topicFilter}
                onSearchChange={setSearchQuery}
                onSentimentChange={setSentimentFilter}
                onTopicChange={setTopicFilter}
                onClear={handleClearFilters}
              />
              <NewsFeed
                news={filteredNews.sector}
                savedItems={savedItems}
                onSave={handleSave}
              />
            </>
          }
          rightColumn={
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Signal Summary</h2>
              <div className={styles.sentimentBreakdown}>
                <h3 className={styles.breakdownTitle}>Sentiment Breakdown</h3>
                <div className={styles.breakdownItems}>
                  <div className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>Positive</span>
                    <span className={styles.breakdownValue}>{sentimentBreakdown.Positive}</span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>Neutral</span>
                    <span className={styles.breakdownValue}>{sentimentBreakdown.Neutral}</span>
                  </div>
                  <div className={styles.breakdownItem}>
                    <span className={styles.breakdownLabel}>Adverse</span>
                    <span className={styles.breakdownValue}>{sentimentBreakdown.Adverse}</span>
                  </div>
                </div>
              </div>
              <div className={styles.topTopics}>
                <h3 className={styles.topicsTitle}>Top Topics</h3>
                <div className={styles.topicChips}>
                  {topTopics.map((topic) => (
                    <span key={topic} className={styles.topicChip}>
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.noiseIndicator}>
                <span className={styles.noiseIcon}>✓</span>
                <span className={styles.noiseText}>Noise removed</span>
              </div>
            </div>
          }
        />
      </main>

      <CopilotWidget sector={sector} />

      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
