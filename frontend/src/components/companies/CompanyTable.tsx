import { Company } from '../../mock/companies';
import { CompanyRow } from './CompanyRow';
import styles from './CompanyTable.module.css';

interface CompanyTableProps {
  companies: Company[];
  onDetailsClick: (company: Company) => void;
}

export function CompanyTable({
  companies,
  onDetailsClick
}: CompanyTableProps) {
  if (companies.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No companies found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.headerCell}>Ticker / Name</th>
              <th className={styles.headerCell}>Market Cap</th>
              <th className={styles.headerCell}>Revenue YoY</th>
              <th className={styles.headerCell}>PAT Margin</th>
              <th className={styles.headerCell}>ROE</th>
              <th className={styles.headerCell}>Debt/Equity</th>
              <th className={styles.headerCell}>Dividend Yield</th>
              <th className={styles.headerCell}>Sentiment</th>
              <th className={styles.headerCell}>Flags</th>
              <th className={styles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <CompanyRow
                key={company.ticker}
                company={company}
                onDetailsClick={onDetailsClick}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
