import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPeersComparison, PeersComparison, CompanySummary } from '../mock/peersJob';
import { Citation } from '../mock/resultJob';
import { CompanyCompareCard } from '../components/compare/CompanyCompareCard';
import { VisualComparison } from '../components/compare/VisualComparison';
import { WhyThisNotThatPanel } from '../components/compare/WhyThisNotThatPanel';
import { EvidenceDrawer } from '../components/result/EvidenceDrawer';
import { CopilotWidget } from '../components/copilot/CopilotWidget';
import styles from './ComparePeersPage.module.css';

export function ComparePeersPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState<PeersComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleWatchlistToggle = (wasAdded: boolean, ticker: string) => {
    setToastMessage(
      wasAdded
        ? `Added ${ticker} to watchlist`
        : `Removed ${ticker} from watchlist`
    );
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const loadComparison = async () => {
      if (!jobId) {
        navigate('/');
        return;
      }

      setIsLoading(true);
      try {
        const data = await getPeersComparison(jobId);
        setComparison(data);
      } catch (error) {
        console.error('Failed to load peers comparison:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadComparison();
  }, [jobId, navigate]);

  const handleCitationClick = (citationId: string) => {
    if (comparison) {
      const citation = comparison.citationsIndex[citationId];
      if (citation) {
        setSelectedCitation(citation);
        setIsDrawerOpen(true);
      }
    }
  };

  const handleEvidenceClick = (company: CompanySummary) => {
    if (comparison && company.summaryEvidenceCitations.length > 0) {
      handleCitationClick(company.summaryEvidenceCitations[0]);
    }
  };


  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Comparison not found.</p>
          <button onClick={() => navigate('/')} className={styles.homeButton}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const allCompanies = [comparison.target, ...comparison.peers];
  const companyLabels = ['Company A', 'Company B', 'Company C'];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Compare with Peers</h1>
          <p className={styles.subtitle}>Target vs Alternatives</p>
        </div>
        <div className={styles.headerRight}>
          <button
            onClick={() => navigate(`/result/${jobId}`)}
            className={styles.backButton}
          >
            Back to Result
          </button>
          <button
            onClick={() => navigate('/monitor')}
            className={styles.monitorButton}
          >
            Go to Monitor
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.cardsRow}>
            {allCompanies.map((company, index) => (
              <CompanyCompareCard
                key={company.ticker}
                company={company}
                isTarget={index === 0}
                onEvidenceClick={() => handleEvidenceClick(company)}
                onWatchlistToggle={handleWatchlistToggle}
              />
            ))}
          </div>

          <VisualComparison
            companies={allCompanies}
            companyLabels={companyLabels}
          />

          <WhyThisNotThatPanel
            whyChooseTarget={comparison.why.whyChooseTarget}
            whyNotPeers={comparison.why.whyNotPeers}
            onCitationClick={handleCitationClick}
            citationsIndex={comparison.citationsIndex}
          />
        </div>
      </main>

      <CopilotWidget sector={comparison.target.sector || 'General'} />

      <EvidenceDrawer
        citation={selectedCitation}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
