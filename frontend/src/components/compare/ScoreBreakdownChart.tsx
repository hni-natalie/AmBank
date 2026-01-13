import { CompanySummary } from '../../mock/peersJob';
import { calculateBreakdown } from './compareUtils';
import styles from './ScoreBreakdownChart.module.css';

interface ScoreBreakdownChartProps {
  companies: CompanySummary[];
  companyLabels: string[];
}

export function ScoreBreakdownChart({ companies, companyLabels }: ScoreBreakdownChartProps) {
  const breakdowns = companies.map((company) => calculateBreakdown(company.confidence, company.kpis));
  
  // Calculate total scores
  const totalScores = breakdowns.map((bd) => bd.fundamentals + bd.news - bd.riskPenalty);
  const maxTotal = Math.max(...totalScores, 100);

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Score Breakdown</h4>
      <div className={styles.chart}>
        {companies.map((company, index) => {
          const breakdown = breakdowns[index];
          const total = totalScores[index];
          const fundamentalsPercent = (breakdown.fundamentals / maxTotal) * 100;
          const newsPercent = (breakdown.news / maxTotal) * 100;
          const riskPercent = (breakdown.riskPenalty / maxTotal) * 100;

          return (
            <div key={company.ticker} className={styles.barContainer}>
              <div className={styles.barLabel}>{companyLabels[index]}</div>
              <div className={styles.barWrapper}>
                <div className={styles.totalScore}>{total}</div>
                <div className={styles.bar}>
                  <div
                    className={styles.segment}
                    style={{
                      width: `${fundamentalsPercent}%`,
                      backgroundColor: '#10b981'
                    }}
                    title={`Fundamentals: ${breakdown.fundamentals}`}
                  />
                  <div
                    className={styles.segment}
                    style={{
                      width: `${newsPercent}%`,
                      backgroundColor: '#3b82f6'
                    }}
                    title={`News: ${breakdown.news}`}
                  />
                  {breakdown.riskPenalty > 0 && (
                    <div
                      className={styles.segmentRisk}
                      style={{
                        width: `${riskPercent}%`,
                        backgroundColor: '#ef4444'
                      }}
                      title={`Risk Penalty: -${breakdown.riskPenalty}`}
                    />
                  )}
                </div>
              </div>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendColor} style={{ backgroundColor: '#10b981' }} />
                  Fundamentals: {breakdown.fundamentals}
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendColor} style={{ backgroundColor: '#3b82f6' }} />
                  News: {breakdown.news}
                </span>
                {breakdown.riskPenalty > 0 && (
                  <span className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: '#ef4444' }} />
                    Risk: -{breakdown.riskPenalty}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
