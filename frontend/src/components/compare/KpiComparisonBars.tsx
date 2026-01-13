import { CompanySummary } from '../../mock/peersJob';
import { normalizeHigherBetter, normalizeLowerBetter, pickBestIndex } from './compareUtils';
import styles from './KpiComparisonBars.module.css';

interface KpiComparisonBarsProps {
  companies: CompanySummary[];
  companyLabels: string[];
}

interface KpiMetric {
  key: string;
  label: string;
  getValue: (company: CompanySummary) => number;
  mode: 'higher' | 'lower';
  format: (value: number) => string;
}

const kpiMetrics: KpiMetric[] = [
  {
    key: 'roe',
    label: 'ROE',
    getValue: (c) => c.kpis.roe,
    mode: 'higher',
    format: (v) => `${v.toFixed(1)}%`
  },
  {
    key: 'debtEquity',
    label: 'Debt/Equity',
    getValue: (c) => c.kpis.debtEquity,
    mode: 'lower',
    format: (v) => v.toFixed(2)
  },
  {
    key: 'patMargin',
    label: 'PAT Margin',
    getValue: (c) => c.kpis.patMargin,
    mode: 'higher',
    format: (v) => `${v.toFixed(1)}%`
  },
  {
    key: 'sentiment',
    label: 'Sentiment (30d)',
    getValue: (c) => c.kpis.sentiment30d,
    mode: 'higher',
    format: (v) => v.toFixed(0)
  },
  {
    key: 'confidence',
    label: 'Confidence',
    getValue: (c) => c.confidence,
    mode: 'higher',
    format: (v) => v.toFixed(0)
  }
];

export function KpiComparisonBars({ companies, companyLabels }: KpiComparisonBarsProps) {
  return (
    <div className={styles.container}>
      <h4 className={styles.title}>KPI Comparison</h4>
      <div className={styles.metrics}>
        {kpiMetrics.map((metric) => {
          const values = companies.map((c) => metric.getValue(c));
          const normalized = metric.mode === 'higher'
            ? normalizeHigherBetter(values)
            : normalizeLowerBetter(values);
          const bestIndex = pickBestIndex(values, metric.mode);

          return (
            <div key={metric.key} className={styles.metricRow}>
              <div className={styles.metricLabel}>{metric.label}</div>
              <div className={styles.barsContainer}>
                {companies.map((company, index) => {
                  const value = values[index];
                  const normalizedValue = normalized[index];
                  const isBest = bestIndex === index;

                  return (
                    <div key={company.ticker} className={styles.barGroup}>
                      <div className={styles.barLabelRow}>
                        <span className={styles.companyLabel}>{companyLabels[index]}</span>
                        {isBest && <span className={styles.bestBadge}>Best</span>}
                        <span className={styles.valueLabel}>{metric.format(value)}</span>
                      </div>
                      <div className={styles.barWrapper}>
                        <div
                          className={`${styles.bar} ${isBest ? styles.barBest : ''}`}
                          style={{ width: `${normalizedValue}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
