import { useState } from 'react';
import { Company } from '../../mock/companies';
import styles from './CompanyDrawer.module.css';

interface CompanyDrawerProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'overview' | 'trends' | 'highlights' | 'evidence';

export function CompanyDrawer({
  company,
  isOpen,
  onClose
}: CompanyDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (!company || !isOpen) {
    return null;
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.companyName}>{company.name}</h2>
            <span className={styles.ticker}>{company.ticker}</span>
          </div>
          <div className={styles.headerActions}>
            <button onClick={onClose} className={styles.closeButton} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'trends' ? styles.active : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Trends
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'highlights' ? styles.active : ''}`}
            onClick={() => setActiveTab('highlights')}
          >
            Report Highlights
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'evidence' ? styles.active : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            Evidence
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <div className={styles.ratioCard}>
                <div className={styles.ratioLabel}>ROE</div>
                <div className={styles.ratioValue}>{company.roe.toFixed(1)}%</div>
              </div>
              <div className={styles.ratioCard}>
                <div className={styles.ratioLabel}>Debt/Equity</div>
                <div className={styles.ratioValue}>{company.debtEquity.toFixed(2)}</div>
              </div>
              <div className={styles.ratioCard}>
                <div className={styles.ratioLabel}>PAT Margin</div>
                <div className={styles.ratioValue}>{company.patMargin.toFixed(1)}%</div>
              </div>
              <div className={styles.ratioCard}>
                <div className={styles.ratioLabel}>Dividend Yield</div>
                <div className={styles.ratioValue}>{company.dividendYield.toFixed(1)}%</div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className={styles.trends}>
              <div className={styles.trendItem}>
                <div className={styles.trendLabel}>Revenue YoY Trend</div>
                <div className={styles.sparkline}>
                  {company.ratiosTrend.revenueYoY.map((value, index) => (
                    <div
                      key={index}
                      className={styles.sparklineBar}
                      style={{
                        height: `${Math.abs(value) * 10}px`,
                        backgroundColor: value >= 0 ? '#10b981' : '#ef4444'
                      }}
                      title={`${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.trendItem}>
                <div className={styles.trendLabel}>ROE Trend</div>
                <div className={styles.sparkline}>
                  {company.ratiosTrend.roe.map((value, index) => (
                    <div
                      key={index}
                      className={styles.sparklineBar}
                      style={{
                        height: `${value * 0.5}px`,
                        backgroundColor: '#3b82f6'
                      }}
                      title={`${value.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.trendItem}>
                <div className={styles.trendLabel}>Debt/Equity Trend</div>
                <div className={styles.sparkline}>
                  {company.ratiosTrend.debtEquity.map((value, index) => (
                    <div
                      key={index}
                      className={styles.sparklineBar}
                      style={{
                        height: `${value * 50}px`,
                        backgroundColor: '#f59e0b'
                      }}
                      title={value.toFixed(2)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'highlights' && (
            <div className={styles.highlights}>
              <ul className={styles.highlightsList}>
                {company.highlights.map((highlight, index) => (
                  <li key={index} className={styles.highlightItem}>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className={styles.evidence}>
              {company.evidence.map((item, index) => (
                <div key={index} className={styles.evidenceItem}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.evidenceLink}
                  >
                    {item.label}
                    {item.page && ` (Page ${item.page})`}
                  </a>
                  {item.snippet && (
                    <p className={styles.evidenceSnippet}>{item.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.closeFooterButton}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
