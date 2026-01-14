import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import styles from './AssessCompanyCard.module.css';



export function AssessCompanyCard() {
  const navigate = useNavigate();
  const setUserInput = useAppStore((state) => state.setUserInput);
  
  const [ticker, setTicker] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRunAssessment = () => {
    const rawTicker = ticker.trim().toUpperCase();

    if (!rawTicker) {
      setErrorMessage('Please enter a company ticker.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Validation: Alphanumeric and dots only
    const tickerRegex = /^[A-Z0-9.]+$/;
    if (!tickerRegex.test(rawTicker)) {
      setErrorMessage('Invalid format. Use letters, numbers, and dots only (e.g., MAYBANK).');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setErrorMessage('');

    // Save to store
    setUserInput({
      ticker: rawTicker,
      companyName: rawTicker, // Fallback: use ticker as name until API resolves it
      sector: undefined
    });

    // Navigate to dashboard where analysis will happen automatically
    navigate('/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className={styles.title}>Assess a Company</h3>
      <p className={styles.description}>
        Enter a Bursa Malaysia ticker to analyze financial ratios, filings, and news signals.
      </p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>
            Company Ticker (Bursa) <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g., MAYBANK, CIMB, PETDAG"
            className={styles.input}
            maxLength={10}
          />
        </div>

        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}

        <button
          type="button"
          onClick={handleRunAssessment}
          disabled={!ticker.trim()}
          className={styles.primaryButton}
        >
          Run Assessment
        </button>

        <p className={styles.helperText}>
          We will analyze financial ratios + Bursa/news signals and produce a decision score.
        </p>
      </div>
    </div>
  );
}
