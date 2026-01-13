import { useState } from 'react';
import { Step } from '../../mock/finalList';
import styles from './StepPlanPanel.module.css';

interface StepPlanPanelProps {
  steps: Step[];
}

export function StepPlanPanel({ steps }: StepPlanPanelProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const toggleStep = (key: string) => {
    setExpandedStep(expandedStep === key ? null : key);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Analysis Pipeline</h3>
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div key={step.key} className={styles.step}>
            <div className={styles.stepHeader} onClick={() => toggleStep(step.key)}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.stepContent}>
                <div className={styles.stepLabel}>{step.label}</div>
                <div className={styles.stepStatus}>
                  <span className={`${styles.statusBadge} ${styles[step.status.toLowerCase()]}`}>
                    {step.status}
                  </span>
                  {step.docCount > 0 && (
                    <span className={styles.docCount}>{step.docCount} docs</span>
                  )}
                </div>
              </div>
              <button className={styles.expandButton}>
                {expandedStep === step.key ? '−' : '+'}
              </button>
            </div>
            {expandedStep === step.key && (
              <div className={styles.stepDetail}>
                <p className={styles.detailText}>{step.detail}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
