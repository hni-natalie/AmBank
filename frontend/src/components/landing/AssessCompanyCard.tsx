import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startAssessmentJob, AssessmentJobPayload } from '../../mock/assessmentJob';
import styles from './AssessCompanyCard.module.css';

const sectors = [
  'Technology',
  'Banks',
  'REIT',
  'Utilities',
  'Consumer',
  'Healthcare',
  'Energy',
  'Industrial'
];

export function AssessCompanyCard() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [ticker, setTicker] = useState('');
  const [sector, setSector] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRunAssessment = async () => {
    if (!companyName.trim()) {
      setErrorMessage('Please enter a company name.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const payload: AssessmentJobPayload = {
        companyName: companyName.trim(),
        ticker: ticker.trim() || undefined,
        sector: sector || undefined
      };

      const response = await startAssessmentJob(payload);
      navigate(`/result/${response.jobId}`);
    } catch (error) {
      setErrorMessage('Failed to start assessment. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 11L12 14L22 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className={styles.title}>Assess a Company</h3>
      <p className={styles.description}>
        Enter company details to analyze financial ratios, Bursa filings, and news signals.
      </p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>
            Company Name <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., ABC Berhad"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Ticker (optional)</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g., ABC"
            className={styles.input}
            maxLength={10}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Sector (optional but recommended)</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className={styles.select}
          >
            <option value="">Select sector</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}

        <button
          type="button"
          onClick={handleRunAssessment}
          disabled={isProcessing || !companyName.trim()}
          className={styles.primaryButton}
        >
          {isProcessing ? 'Processing...' : 'Run Assessment'}
        </button>

        <p className={styles.helperText}>
          We will analyze financial ratios + Bursa/news signals and produce a decision score.
        </p>
      </div>
    </div>
  );
}
