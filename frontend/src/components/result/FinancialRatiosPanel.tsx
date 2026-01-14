import { FinancialRatios } from '../../mock/resultJob';
import styles from './FinancialRatiosPanel.module.css';

interface FinancialRatiosPanelProps {
  ratios: FinancialRatios;
  onViewEvidence: () => void;
}

export function FinancialRatiosPanel({ ratios, onViewEvidence }: FinancialRatiosPanelProps) {
  const ratioCards = [
    { label: 'ROE', value: `${ratios.roe.toFixed(1)}%`, trend: ratios.trend?.roe },
    { label: 'Debt/Equity', value: ratios.debtEquity.toFixed(2), trend: ratios.trend?.debtEquity },
    { label: 'Current Ratio', value: ratios.currentRatio.toFixed(2) },
    { label: 'PAT Margin', value: `${ratios.patMargin.toFixed(1)}%`, trend: ratios.trend?.patMargin },
    { label: 'Revenue YoY', value: `${ratios.revenueYoY >= 0 ? '+' : ''}${ratios.revenueYoY.toFixed(1)}%` },
    { label: 'Interest Coverage', value: ratios.interestCoverage.toFixed(1) }
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Financial Ratios</h3>
      <div className={styles.ratiosGrid}>
        {ratioCards.map((ratio) => (
          <div key={ratio.label} className={styles.ratioCard}>
            <div className={styles.ratioLabel}>{ratio.label}</div>
            <div className={styles.ratioValue}>{ratio.value}</div>
            {ratio.trend && (
              <div className={styles.trend}>
                {ratio.trend.map((val, idx) => (
                  <span key={idx} className={styles.trendValue}>
                    {typeof val === 'number' ? val.toFixed(1) : val}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onViewEvidence}
        className={styles.evidenceLink}
      >
        View extracted evidence →
      </button>
    </div>
  );
}
