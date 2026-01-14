import { Citation } from '../../mock/copilot';
import styles from './CopilotMessage.module.css';

interface CopilotMessageProps {
  message: string;
  isUser: boolean;
  citations?: Citation[];
  steps?: string[];
}

export function CopilotMessage({ message, isUser, citations, steps }: CopilotMessageProps) {
  return (
    <div className={`${styles.container} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.content}>
        <p className={styles.text}>{message}</p>
        
        {steps && steps.length > 0 && (
          <div className={styles.steps}>
            <strong className={styles.stepsLabel}>Steps:</strong>
            <ul className={styles.stepsList}>
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {citations && citations.length > 0 && (
          <div className={styles.citations}>
            <strong className={styles.citationsLabel}>Citations:</strong>
            <div className={styles.citationChips}>
              {citations.map((citation, index) => (
                <a
                  key={index}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.citationChip}
                  title={citation.snippet}
                >
                  {citation.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
