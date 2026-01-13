import { useState } from 'react';
import { FinalCompany } from '../../mock/finalList';
import styles from './EvidenceDrawer.module.css';

type EvidenceTab = 'news' | 'filings' | 'annualReports';

interface EvidenceDrawerProps {
  company: FinalCompany | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EvidenceDrawer({ company, isOpen, onClose }: EvidenceDrawerProps) {
  const [activeTab, setActiveTab] = useState<EvidenceTab>('news');

  if (!company || !isOpen) {
    return null;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>Evidence for {company.name}</h2>
            <span className={styles.ticker}>{company.ticker}</span>
          </div>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'news' ? styles.active : ''}`}
            onClick={() => setActiveTab('news')}
          >
            News Evidence ({company.evidence.news.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'filings' ? styles.active : ''}`}
            onClick={() => setActiveTab('filings')}
          >
            Bursa Filings ({company.evidence.filings.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'annualReports' ? styles.active : ''}`}
            onClick={() => setActiveTab('annualReports')}
          >
            Annual Reports ({company.evidence.annualReports.length})
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'news' && (
            <div className={styles.evidenceList}>
              {company.evidence.news.map((item, index) => (
                <div key={index} className={styles.evidenceItem}>
                  <div className={styles.evidenceHeader}>
                    <h3 className={styles.evidenceTitle}>{item.title}</h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openLink}
                    >
                      Open →
                    </a>
                  </div>
                  <div className={styles.evidenceMeta}>
                    {item.date && <span className={styles.metaItem}>{formatDate(item.date)}</span>}
                    {item.source && <span className={styles.metaItem}>{item.source}</span>}
                    <span className={styles.metaItem}>{item.label}</span>
                  </div>
                  {item.snippet && (
                    <p className={styles.evidenceSnippet}>{item.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'filings' && (
            <div className={styles.evidenceList}>
              {company.evidence.filings.map((item, index) => (
                <div key={index} className={styles.evidenceItem}>
                  <div className={styles.evidenceHeader}>
                    <h3 className={styles.evidenceTitle}>{item.title}</h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openLink}
                    >
                      Open →
                    </a>
                  </div>
                  <div className={styles.evidenceMeta}>
                    {item.date && <span className={styles.metaItem}>{formatDate(item.date)}</span>}
                    {item.source && <span className={styles.metaItem}>{item.source}</span>}
                    <span className={styles.metaItem}>{item.label}</span>
                  </div>
                  {item.snippet && (
                    <p className={styles.evidenceSnippet}>{item.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'annualReports' && (
            <div className={styles.evidenceList}>
              {company.evidence.annualReports.map((item, index) => (
                <div key={index} className={styles.evidenceItem}>
                  <div className={styles.evidenceHeader}>
                    <h3 className={styles.evidenceTitle}>
                      {item.title}
                      {item.page && <span className={styles.pageNumber}> (Page {item.page})</span>}
                    </h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openLink}
                    >
                      Open →
                    </a>
                  </div>
                  <div className={styles.evidenceMeta}>
                    <span className={styles.metaItem}>{item.label}</span>
                  </div>
                  {item.snippet && (
                    <p className={styles.evidenceSnippet}>{item.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
