import { useState } from 'react';
import styles from './GuidedChat.module.css';

interface GuidedChatProps {
  onPreferencesSubmit: (preferences: {
    time_horizon: string;
    risk_level: string;
    sectors: string[];
    bank_statement?: File;
  }) => void;
}

const timeHorizons = ['short', 'medium', 'long'];
const riskLevels = ['conservative', 'balanced', 'aggressive'];
const availableSectors = [
  'technology',
  'finance',
  'healthcare',
  'energy',
  'consumer',
  'industrial',
  'construction',
  'property',
  'plantation',
  'telecommunications',
  'transportation',
  'utilities',
  'reit',
];


const timeHorizonDescriptions: { [key: string]: string } = {
  short: 'less than 1 year',
  medium: '1-5 years',
  long: '5+ years'
};

const riskLevelDescriptions: { [key: string]: string } = {
  conservative: 'stable, lower returns',
  balanced: 'moderate risk',
  aggressive: 'higher risk, higher returns'
};

/**
 * GuidedChat component - collects user preferences with sliders, dropdown, and file upload.
 * White and dark blue theme with dark blue text.
 */
export const GuidedChat: React.FC<GuidedChatProps> = ({ onPreferencesSubmit }) => {
  const [timeHorizonValue, setTimeHorizonValue] = useState<number>(1); // 0=short, 1=medium, 2=long
  const [riskLevelValue, setRiskLevelValue] = useState<number>(1); // 0=conservative, 1=balanced, 2=aggressive
  const [sector, setSector] = useState<string>('');
  const [bankStatement, setBankStatement] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const timeHorizon = timeHorizons[timeHorizonValue];
  const riskLevel = riskLevels[riskLevelValue];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBankStatement(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!submitted) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!submitted && e.dataTransfer.files && e.dataTransfer.files[0]) {
      setBankStatement(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!timeHorizon || !riskLevel || !sector) {
      return;
    }

    const preferences = {
      time_horizon: timeHorizon,
      risk_level: riskLevel,
      sectors: [sector],
      bank_statement: bankStatement || undefined
    };
    
    onPreferencesSubmit(preferences);
    setSubmitted(true);
  };

  const canSubmit = timeHorizon && riskLevel && sector && !submitted;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          Tell us about your preferences
        </h1>
        <p className={styles.subtitle}>
          We'll use this information to provide personalized recommendations
        </p>

        {/* Time Horizon Slider */}
        <div className={styles.section}>
          <div className={styles.card}>
            <label className={styles.label}>
              Time Horizon
            </label>
            <div className={styles.sliderContainer}>
            <div className={styles.sliderWrapper}>
              <div
                className={styles.sliderTrack}
                style={{
                  width: `${(timeHorizonValue / (timeHorizons.length - 1)) * 100}%`
                }}
              />
              <input
                type="range"
                min="0"
                max={timeHorizons.length - 1}
                step="1"
                value={timeHorizonValue}
                onChange={(e) => !submitted && setTimeHorizonValue(Number(e.target.value))}
                disabled={submitted}
                className={styles.sliderInput}
              />
            </div>
            <div className={styles.sliderLabels}>
              {timeHorizons.map((horizon) => {
                const isSelected = horizon === timeHorizon;
                return (
                  <div key={horizon} className={styles.sliderLabelContainer}>
                    <span className={`${styles.sliderLabel} ${isSelected ? styles.sliderLabelSelected : ''}`}>
                      {horizon}
                    </span>
                    <span className={`${styles.sliderDescription} ${isSelected ? styles.sliderDescriptionSelected : ''}`}>
                      {timeHorizonDescriptions[horizon]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>

        {/* Risk Level Slider */}
        <div className={styles.section}>
          <div className={styles.card}>
            <label className={styles.label}>
              Risk Level
            </label>
            <div className={styles.sliderContainer}>
            <div className={styles.sliderWrapper}>
              <div
                className={styles.sliderTrack}
                style={{
                  width: `${(riskLevelValue / (riskLevels.length - 1)) * 100}%`
                }}
              />
              <input
                type="range"
                min="0"
                max={riskLevels.length - 1}
                step="1"
                value={riskLevelValue}
                onChange={(e) => !submitted && setRiskLevelValue(Number(e.target.value))}
                disabled={submitted}
                className={styles.sliderInput}
              />
            </div>
            <div className={styles.sliderLabels}>
              {riskLevels.map((level) => {
                const isSelected = level === riskLevel;
                return (
                  <div key={level} className={styles.sliderLabelContainer}>
                    <span className={`${styles.sliderLabel} ${isSelected ? styles.sliderLabelSelected : ''}`}>
                      {level}
                    </span>
                    <span className={`${styles.sliderDescription} ${isSelected ? styles.sliderDescriptionSelected : ''}`}>
                      {riskLevelDescriptions[level]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>

        {/* Sector Dropdown */}
        <div className={styles.section}>
          <div className={styles.card}>
            <label className={styles.label}>
              Sector
            </label>
            <p className={styles.description}>
              Choose the sector you want to invest in—each has different growth potential and risk
            </p>
            <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            disabled={submitted}
            className={styles.dropdown}
          >
            <option value="" disabled>
              Select a sector
            </option>
            {availableSectors.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bank Statement Upload */}
        <div className={styles.section}>
          <div className={styles.card}>
            <label className={styles.label}>
              Bank Statement (Optional)
            </label>
            <p className={styles.description}>
              Upload your bank statement so we can tailor recommendations to your finances.
            </p>
            <div
            className={`${styles.fileUploadContainer} ${isDragOver ? styles.dragOver : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="bank-statement-upload"
              accept=".pdf,.csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={submitted}
              className={styles.fileInput}
            />
            <label
              htmlFor="bank-statement-upload"
              className={styles.fileUploadLabel}
            >
              {bankStatement ? (
                <div className={styles.fileUploadContent}>
                  <div className={styles.fileUploadIcon}>✓</div>
                  <div>
                    <div className={styles.fileName}>
                      {bankStatement.name}
                    </div>
                    <div className={styles.fileUploadSubtext}>
                      Click to change file
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.fileUploadContent}>
                  <div className={styles.fileUploadIcon}>📄</div>
                  <div>
                    <div className={styles.fileUploadText}>
                      Click to upload or drag and drop
                    </div>
                    <div className={styles.fileUploadSubtext}>
                      PDF, CSV, or Excel files
                    </div>
                  </div>
                </div>
              )}
            </label>
          </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={styles.submitButton}
        >
          {submitted ? 'Processing...' : 'Get Investment Decision'}
        </button>
      </div>
    </div>
  );
};
