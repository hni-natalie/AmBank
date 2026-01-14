import { ComparisonRow, CellValue } from '../../mock/peersJob';
import styles from './ComparisonTable.module.css';

interface ComparisonTableProps {
  rows: ComparisonRow[];
}

export function ComparisonTable({ rows }: ComparisonTableProps) {
  const getVerdictIcon = (verdict?: string) => {
    switch (verdict) {
      case 'A':
        return '✅';
      case 'B':
      case 'C':
        return '⚠️';
      default:
        return '';
    }
  };

  const formatValue = (value: CellValue): string => {
    if (typeof value === 'object' && value !== null) {
      return String(value.value);
    }
    return String(value);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Comparison</h3>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerCell}>Metric</th>
              <th className={styles.headerCell}>Company A</th>
              <th className={styles.headerCell}>Company B</th>
              <th className={styles.headerCell}>Company C</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={styles.row}>
                <td className={styles.labelCell}>
                  <div className={styles.labelContent}>
                    <span>{row.label}</span>
                    {row.verdict && (
                      <span className={styles.verdictIcon}>{getVerdictIcon(row.verdict)}</span>
                    )}
                  </div>
                </td>
                <td className={`${styles.cell} ${row.verdict === 'A' ? styles.cellBest : ''}`}>
                  {formatValue(row.a)}
                </td>
                <td className={`${styles.cell} ${row.verdict === 'B' ? styles.cellBest : ''}`}>
                  {formatValue(row.b)}
                </td>
                <td className={`${styles.cell} ${row.verdict === 'C' ? styles.cellBest : ''}`}>
                  {formatValue(row.c)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some((row) => row.citations && row.citations.length > 0) && (
        <div className={styles.citationsNote}>
          <p className={styles.noteText}>
            Some metrics have evidence citations available.
          </p>
        </div>
      )}
    </div>
  );
}
