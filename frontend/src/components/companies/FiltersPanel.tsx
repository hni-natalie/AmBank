import styles from './FiltersPanel.module.css';

export type SortOption = 'ROE desc' | 'Dividend desc' | 'Lowest D/E' | 'Revenue growth';

interface FiltersPanelProps {
  marketCapMin: string;
  marketCapMax: string;
  minDividendYield: string;
  maxDebtEquity: string;
  positiveSentimentOnly: boolean;
  excludeFlagged: boolean;
  sortBy: SortOption;
  onMarketCapMinChange: (value: string) => void;
  onMarketCapMaxChange: (value: string) => void;
  onMinDividendYieldChange: (value: string) => void;
  onMaxDebtEquityChange: (value: string) => void;
  onPositiveSentimentOnlyChange: (value: boolean) => void;
  onExcludeFlaggedChange: (value: boolean) => void;
  onSortByChange: (value: SortOption) => void;
  onApply: () => void;
  onReset: () => void;
}

export function FiltersPanel({
  marketCapMin,
  marketCapMax,
  minDividendYield,
  maxDebtEquity,
  positiveSentimentOnly,
  excludeFlagged,
  sortBy,
  onMarketCapMinChange,
  onMarketCapMaxChange,
  onMinDividendYieldChange,
  onMaxDebtEquityChange,
  onPositiveSentimentOnlyChange,
  onExcludeFlaggedChange,
  onSortByChange,
  onApply,
  onReset
}: FiltersPanelProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Filters</h3>

      <div className={styles.section}>
        <label className={styles.label}>Market Cap Range (Billions)</label>
        <div className={styles.inputGroup}>
          <input
            type="number"
            placeholder="Min"
            value={marketCapMin}
            onChange={(e) => onMarketCapMinChange(e.target.value)}
            className={styles.input}
          />
          <span className={styles.separator}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={marketCapMax}
            onChange={(e) => onMarketCapMaxChange(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Min Dividend Yield (%)</label>
        <input
          type="number"
          step="0.1"
          placeholder="0.0"
          value={minDividendYield}
          onChange={(e) => onMinDividendYieldChange(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Max Debt/Equity</label>
        <input
          type="number"
          step="0.1"
          placeholder="No limit"
          value={maxDebtEquity}
          onChange={(e) => onMaxDebtEquityChange(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={positiveSentimentOnly}
            onChange={(e) => onPositiveSentimentOnlyChange(e.target.checked)}
            className={styles.checkbox}
          />
          <span>Positive sentiment only</span>
        </label>
      </div>

      <div className={styles.section}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={excludeFlagged}
            onChange={(e) => onExcludeFlaggedChange(e.target.checked)}
            className={styles.checkbox}
          />
          <span>Exclude flagged events</span>
        </label>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortOption)}
          className={styles.select}
        >
          <option value="ROE desc">ROE (descending)</option>
          <option value="Dividend desc">Dividend Yield (descending)</option>
          <option value="Lowest D/E">Lowest Debt/Equity</option>
          <option value="Revenue growth">Revenue Growth</option>
        </select>
      </div>

      <div className={styles.actions}>
        <button onClick={onApply} className={styles.applyButton}>
          Apply
        </button>
        <button onClick={onReset} className={styles.resetButton}>
          Reset
        </button>
      </div>
    </div>
  );
}
