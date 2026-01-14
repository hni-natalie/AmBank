import { CompanySummary } from '../../mock/peersJob';
import { ScoreBreakdownChart } from './ScoreBreakdownChart';
import { KpiComparisonBars } from './KpiComparisonBars';
import styles from './VisualComparison.module.css';

interface VisualComparisonProps {
  companies: CompanySummary[];
  companyLabels: string[];
}

export function VisualComparison({ companies, companyLabels }: VisualComparisonProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Visual Comparison</h3>
      <div className={styles.chartsGrid}>
        <div className={styles.chartColumn}>
          <ScoreBreakdownChart companies={companies} companyLabels={companyLabels} />
        </div>
        <div className={styles.chartColumn}>
          <KpiComparisonBars companies={companies} companyLabels={companyLabels} />
        </div>
      </div>
    </div>
  );
}
