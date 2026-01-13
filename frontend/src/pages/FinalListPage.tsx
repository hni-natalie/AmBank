import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FinalLayout } from '../components/final/FinalLayout';
import { FinalSummaryHeader } from '../components/final/FinalSummaryHeader';
import { FinalCompanyTable } from '../components/final/FinalCompanyTable';
import { StepPlanPanel } from '../components/final/StepPlanPanel';
import { EvidenceDrawer } from '../components/final/EvidenceDrawer';
import { CopilotWidget } from '../components/copilot/CopilotWidget';
import { mockFinalList, FinalCompany } from '../mock/finalList';
import { loadWatchlist, saveWatchlist, toggleWatchlist, isWatchlisted, WatchlistItem } from '../utils/watchlist';
import styles from './FinalListPage.module.css';

export function FinalListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const sector = searchParams.get('sector') || '';
  const tickersParam = searchParams.get('tickers');

  const [selectedCompany, setSelectedCompany] = useState<FinalCompany | null>(null);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  // Load watchlist from localStorage
  useEffect(() => {
    setWatchlist(loadWatchlist());
  }, []);

  // Filter companies based on tickers from query or show all
  const companies = useMemo(() => {
    let filtered = mockFinalList.companies;

    // If tickers are provided in query, filter to those companies
    if (tickersParam) {
      const tickers = tickersParam.split(',').map((t) => t.trim());
      filtered = filtered.filter((c) => tickers.includes(c.ticker));
    }

    // Update watchlisted status
    return filtered.map((c) => ({
      ...c,
      watchlisted: isWatchlisted(c.ticker, watchlist)
    }));
  }, [tickersParam, watchlist]);

  // Update final list data with filtered companies
  const finalListData = useMemo(() => {
    return {
      ...mockFinalList,
      sector: sector || mockFinalList.sector,
      finalCount: companies.length,
      companies
    };
  }, [sector, companies]);

  const handleEvidenceClick = (company: FinalCompany) => {
    setSelectedCompany(company);
    setIsEvidenceDrawerOpen(true);
  };

  const handleWatchlistToggle = (ticker: string) => {
    const company = companies.find((c) => c.ticker === ticker);
    if (!company) return;

    const watchlistItem: WatchlistItem = {
      ticker: company.ticker,
      name: company.name,
      sector: sector || mockFinalList.sector
    };

    const { updated, wasAdded } = toggleWatchlist(watchlistItem, watchlist);
    setWatchlist(updated);
    saveWatchlist(updated);

    if (wasAdded) {
      setToastMessage(`Added ${ticker} to watchlist`);
    } else {
      setToastMessage(`Removed ${ticker} from watchlist`);
    }
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleExportCSV = () => {
    // Simple CSV export
    const headers = ['Rank', 'Ticker', 'Name', 'Rating', 'Score', 'Rationale'];
    const rows = companies.map((c, index) => [
      index + 1,
      c.ticker,
      c.name,
      c.rating,
      c.score,
      c.rationale
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `final-list-${sector || 'companies'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!sector) {
    return (
      <div className={styles.emptyState}>
        <h2>No Sector Selected</h2>
        <p>Please select a sector to view the final list.</p>
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
          <h1 className={styles.title}>Final Best-Performing Companies</h1>
          <p className={styles.subtitle}>Sector: {sector}</p>
        </div>
        <div className={styles.headerRight}>
          <button
            onClick={() => navigate(`/companies?sector=${encodeURIComponent(sector)}`)}
            className={styles.backButton}
          >
            Back
          </button>
          <button onClick={handleExportCSV} className={styles.exportButton}>
            Export CSV
          </button>
          <button onClick={() => navigate('/')} className={styles.newAnalysisButton}>
            New Analysis
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <FinalLayout
          mainContent={
            <>
              <FinalSummaryHeader data={finalListData} />
              <FinalCompanyTable
                companies={companies}
                onEvidenceClick={handleEvidenceClick}
                onWatchlistToggle={handleWatchlistToggle}
              />
            </>
          }
          sidePanel={<StepPlanPanel steps={finalListData.steps} />}
        />
      </main>

      <EvidenceDrawer
        company={selectedCompany}
        isOpen={isEvidenceDrawerOpen}
        onClose={() => setIsEvidenceDrawerOpen(false)}
      />

      <CopilotWidget sector={sector} />

      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
