import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssessmentResult, AssessmentResult, Citation } from '../mock/resultJob';
import { ResultLayout } from '../components/result/ResultLayout';
import { DecisionHero } from '../components/result/DecisionHero';
import { WhyPanel } from '../components/result/WhyPanel';
import { FinancialRatiosPanel } from '../components/result/FinancialRatiosPanel';
import { EvidenceDrawer } from '../components/result/EvidenceDrawer';
import { CopilotWidget } from '../components/copilot/CopilotWidget';
import styles from './CompanyResultPage.module.css';

export function CompanyResultPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const loadResult = async () => {
      if (!jobId) {
        navigate('/');
        return;
      }

      setIsLoading(true);
      try {
        const data = await getAssessmentResult(jobId);
        setResult(data);
      } catch (error) {
        console.error('Failed to load assessment result:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [jobId, navigate]);

  const handleCitationClick = (citationId: string) => {
    if (result) {
      const citation = result.citationsIndex[citationId];
      if (citation) {
        setSelectedCitation(citation);
        setIsDrawerOpen(true);
      }
    }
  };

  const handleComparePeers = () => {
    if (jobId) {
      navigate(`/compare/${jobId}`);
    }
  };

  const handleViewEvidence = () => {
    // Open first AR citation if available
    if (result) {
      const arCitation = Object.values(result.citationsIndex).find((c) => c.type === 'AR');
      if (arCitation) {
        handleCitationClick(arCitation.id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>Loading assessment result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Assessment result not found.</p>
          <button onClick={() => navigate('/')} className={styles.homeButton}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Assessment Result</h1>
          <p className={styles.subtitle}>Target: {result.company.name}</p>
        </div>
        <div className={styles.headerRight}>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            Back
          </button>
          <button onClick={handleComparePeers} className={styles.compareButton}>
            Compare with Peers
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <DecisionHero result={result} />

          <ResultLayout
            leftColumn={
              <WhyPanel
                reasonsYes={result.reasonsYes}
                reasonsNo={result.reasonsNo}
                onCitationClick={handleCitationClick}
              />
            }
            rightColumn={
              <>
                <FinancialRatiosPanel
                  ratios={result.ratios}
                  onViewEvidence={handleViewEvidence}
                />
                {result.flags.length > 0 && (
                  <div className={styles.keyFlagsCard}>
                    <h3 className={styles.cardTitle}>Key Flags</h3>
                    <div className={styles.flags}>
                      {result.flags.map((flag) => (
                        <span key={flag} className={styles.flagChip}>
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            }
          />
        </div>
      </main>

      <CopilotWidget sector={result.company.sector || 'General'} />

      <EvidenceDrawer
        citation={selectedCitation}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
}
