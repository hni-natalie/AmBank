import { Company, Sentiment } from '../../mock/companies';
import { getSentimentBadgeClass } from '../../utils/sentiment';
import styles from './CompanyRow.module.css';

interface CompanyRowProps {
  company: Company;
  onDetailsClick: (company: Company) => void;
}

export function CompanyRow({
  company,
  onDetailsClick
}: CompanyRowProps) {
  const formatMarketCap = (cap: number) => {
    if (cap >= 1000) {
      return `$${(cap / 1000).toFixed(1)}T`;
    }
    return `$${cap.toFixed(0)}B`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const sentimentMap: Record<Sentiment, string> = {
    POSITIVE: 'Positive',
    NEUTRAL: 'Neutral',
    ADVERSE: 'Adverse'
  };

  return (
    <tr className={styles.row}>
      <td className={styles.tickerCell}>
        <div className={styles.tickerName}>
          <span className={styles.ticker}>{company.ticker}</span>
          <span className={styles.name}>{company.name}</span>
        </div>
      </td>
      <td className={styles.cell}>{formatMarketCap(company.marketCap)}</td>
      <td className={styles.cell}>{formatPercentage(company.revenueYoY)}</td>
      <td className={styles.cell}>{company.patMargin.toFixed(1)}%</td>
      <td className={styles.cell}>{company.roe.toFixed(1)}%</td>
      <td className={styles.cell}>{company.debtEquity.toFixed(2)}</td>
      <td className={styles.cell}>{company.dividendYield.toFixed(1)}%</td>
      <td className={styles.cell}>
        <span className={getSentimentBadgeClass(sentimentMap[company.sentiment] as 'Positive' | 'Neutral' | 'Adverse')}>
          {sentimentMap[company.sentiment]}
        </span>
      </td>
      <td className={styles.flagsCell}>
        <div className={styles.flags}>
          {company.flags.map((flag) => (
            <span key={flag} className={styles.flagChip}>
              {flag}
            </span>
          ))}
        </div>
      </td>
      <td className={styles.actionsCell}>
        <div className={styles.actions}>
          <button
            onClick={() => onDetailsClick(company)}
            className={styles.detailsButton}
          >
            Details
          </button>
        </div>
      </td>
    </tr>
  );
}
