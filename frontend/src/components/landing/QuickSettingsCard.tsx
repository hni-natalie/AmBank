import styles from './QuickSettingsCard.module.css';

interface QuickSettingsCardProps {
  objective: 'new' | 'increase' | 'monitor';
  riskAppetite: 'conservative' | 'balanced' | 'aggressive';
  timeHorizon: 'short' | 'mid' | 'long' | '';
  onObjectiveChange: (objective: 'new' | 'increase' | 'monitor') => void;
  onRiskAppetiteChange: (risk: 'conservative' | 'balanced' | 'aggressive') => void;
  onTimeHorizonChange: (horizon: 'short' | 'mid' | 'long' | '') => void;
  onRunAssessment: () => void;
  onUseSample: () => void;
  hasFile: boolean;
  isProcessing: boolean;
}

export function QuickSettingsCard({
  objective,
  riskAppetite,
  timeHorizon,
  onObjectiveChange,
  onRiskAppetiteChange,
  onTimeHorizonChange,
  onRunAssessment,
  onUseSample,
  hasFile,
  isProcessing
}: QuickSettingsCardProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Quick Settings</h3>

      <div className={styles.section}>
        <label className={styles.sectionLabel}>Relationship Objective</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="objective"
              value="new"
              checked={objective === 'new'}
              onChange={() => onObjectiveChange('new')}
              className={styles.radio}
            />
            <span>New relationship</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="objective"
              value="increase"
              checked={objective === 'increase'}
              onChange={() => onObjectiveChange('increase')}
              className={styles.radio}
            />
            <span>Increase exposure</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="objective"
              value="monitor"
              checked={objective === 'monitor'}
              onChange={() => onObjectiveChange('monitor')}
              className={styles.radio}
            />
            <span>Monitor existing client</span>
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.sectionLabel}>Risk Appetite</label>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segment} ${riskAppetite === 'conservative' ? styles.segmentActive : ''}`}
            onClick={() => onRiskAppetiteChange('conservative')}
          >
            Conservative
          </button>
          <button
            type="button"
            className={`${styles.segment} ${riskAppetite === 'balanced' ? styles.segmentActive : ''}`}
            onClick={() => onRiskAppetiteChange('balanced')}
          >
            Balanced
          </button>
          <button
            type="button"
            className={`${styles.segment} ${riskAppetite === 'aggressive' ? styles.segmentActive : ''}`}
            onClick={() => onRiskAppetiteChange('aggressive')}
          >
            Aggressive
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.sectionLabel}>Time Horizon (optional)</label>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segment} ${timeHorizon === 'short' ? styles.segmentActive : ''}`}
            onClick={() => onTimeHorizonChange(timeHorizon === 'short' ? '' : 'short')}
          >
            Short
          </button>
          <button
            type="button"
            className={`${styles.segment} ${timeHorizon === 'mid' ? styles.segmentActive : ''}`}
            onClick={() => onTimeHorizonChange(timeHorizon === 'mid' ? '' : 'long')}
          >
            Mid
          </button>
          <button
            type="button"
            className={`${styles.segment} ${timeHorizon === 'long' ? styles.segmentActive : ''}`}
            onClick={() => onTimeHorizonChange(timeHorizon === 'long' ? '' : 'long')}
          >
            Long
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onRunAssessment}
          disabled={!hasFile || isProcessing}
          className={styles.primaryButton}
        >
          {isProcessing ? 'Processing...' : 'Run Assessment'}
        </button>
        <button
          type="button"
          onClick={onUseSample}
          className={styles.secondaryButton}
        >
          Use Sample Portfolio
        </button>
      </div>
    </div>
  );
}
