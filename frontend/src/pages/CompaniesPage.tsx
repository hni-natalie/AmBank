import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CompaniesLayout } from '../components/companies/CompaniesLayout';
import { FiltersPanel, SortOption } from '../components/companies/FiltersPanel';
import { CompanyTable } from '../components/companies/CompanyTable';
import { CompanyDrawer } from '../components/companies/CompanyDrawer';
import { CopilotWidget } from '../components/copilot/CopilotWidget';
import { mockCompanies, Company } from '../mock/companies';
import styles from './CompaniesPage.module.css';

export function CompaniesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const sector = searchParams.get('sector') || '';

  // Filters state
  const [marketCapMin, setMarketCapMin] = useState('');
  const [marketCapMax, setMarketCapMax] = useState('');
  const [minDividendYield, setMinDividendYield] = useState('');
  const [maxDebtEquity, setMaxDebtEquity] = useState('');
  const [positiveSentimentOnly, setPositiveSentimentOnly] = useState(false);
  const [excludeFlagged, setExcludeFlagged] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('ROE desc');

  // UI state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter companies by sector
  const sectorCompanies = useMemo(() => {
    if (!sector) return [];
    return mockCompanies.filter((c) => c.sector.toLowerCase() === sector.toLowerCase());
  }, [sector]);

  // Apply filters
  const filteredCompanies = useMemo(() => {
    let filtered = [...sectorCompanies];

    // Market cap filter
    if (marketCapMin) {
      const min = parseFloat(marketCapMin) * 1000; // Convert billions to millions
      filtered = filtered.filter((c) => c.marketCap >= min);
    }
    if (marketCapMax) {
      const max = parseFloat(marketCapMax) * 1000;
      filtered = filtered.filter((c) => c.marketCap <= max);
    }

    // Dividend yield filter
    if (minDividendYield) {
      const min = parseFloat(minDividendYield);
      filtered = filtered.filter((c) => c.dividendYield >= min);
    }

    // Debt/equity filter
    if (maxDebtEquity) {
      const max = parseFloat(maxDebtEquity);
      filtered = filtered.filter((c) => c.debtEquity <= max);
    }

    // Sentiment filter
    if (positiveSentimentOnly) {
      filtered = filtered.filter((c) => c.sentiment === 'POSITIVE');
    }

    // Flags filter
    if (excludeFlagged) {
      filtered = filtered.filter((c) => c.flags.length === 0);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'ROE desc':
          return b.roe - a.roe;
        case 'Dividend desc':
          return b.dividendYield - a.dividendYield;
        case 'Lowest D/E':
          return a.debtEquity - b.debtEquity;
        case 'Revenue growth':
          return b.revenueYoY - a.revenueYoY;
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    sectorCompanies,
    marketCapMin,
    marketCapMax,
    minDividendYield,
    maxDebtEquity,
    positiveSentimentOnly,
    excludeFlagged,
    sortBy
  ]);

  const handleDetailsClick = (company: Company) => {
    setSelectedCompany(company);
    setIsDrawerOpen(true);
  };

  const handleResetFilters = () => {
    setMarketCapMin('');
    setMarketCapMax('');
    setMinDividendYield('');
    setMaxDebtEquity('');
    setPositiveSentimentOnly(false);
    setExcludeFlagged(false);
    setSortBy('ROE desc');
  };

  if (!sector) {
    return (
      <div className={styles.emptyState}>
        <h2>No Sector Selected</h2>
        <p>Please select a sector from the homepage to view companies.</p>
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
          <h1 className={styles.title}>Top Companies (Fundamentals)</h1>
          <p className={styles.subtitle}>Sector: {sector}</p>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            Back to Home
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <CompaniesLayout
          filtersPanel={
            <FiltersPanel
              marketCapMin={marketCapMin}
              marketCapMax={marketCapMax}
              minDividendYield={minDividendYield}
              maxDebtEquity={maxDebtEquity}
              positiveSentimentOnly={positiveSentimentOnly}
              excludeFlagged={excludeFlagged}
              sortBy={sortBy}
              onMarketCapMinChange={setMarketCapMin}
              onMarketCapMaxChange={setMarketCapMax}
              onMinDividendYieldChange={setMinDividendYield}
              onMaxDebtEquityChange={setMaxDebtEquity}
              onPositiveSentimentOnlyChange={setPositiveSentimentOnly}
              onExcludeFlaggedChange={setExcludeFlagged}
              onSortByChange={setSortBy}
              onApply={() => {}}
              onReset={handleResetFilters}
            />
          }
          table={
            <CompanyTable
              companies={filteredCompanies}
              onDetailsClick={handleDetailsClick}
            />
          }
        />
      </main>

      <CompanyDrawer
        company={selectedCompany}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <CopilotWidget sector={sector} />
    </div>
  );
}
