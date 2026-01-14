import styles from './StepPreview.module.css';

const steps = [
  {
    number: 1,
    label: 'Parse portfolio',
    description: 'Extract ratios'
  },
  {
    number: 2,
    label: 'Retrieve Bursa filings',
    description: 'For Company A'
  },
  {
    number: 3,
    label: 'Retrieve targeted news',
    description: 'Sentiment + rationale'
  },
  {
    number: 4,
    label: 'Combine signals',
    description: 'Decision + confidence score'
  },
  {
    number: 5,
    label: 'Prepare comparison candidates',
    description: 'B & C'
  }
];

export function StepPreview() {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Assessment Pipeline</h3>
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <div key={step.number} className={styles.step}>
            <div className={styles.stepNumber}>{step.number}</div>
            <div className={styles.stepContent}>
              <div className={styles.stepLabel}>{step.label}</div>
              <div className={styles.stepDescription}>{step.description}</div>
            </div>
            {index < steps.length - 1 && <div className={styles.connector} />}
          </div>
        ))}
      </div>
    </div>
  );
}
