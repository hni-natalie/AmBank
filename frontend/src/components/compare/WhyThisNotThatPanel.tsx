import { Citation } from '../../mock/resultJob';
import styles from './WhyThisNotThatPanel.module.css';

interface WhyThisNotThatPanelProps {
  whyChooseTarget: Array<{ text: string; citations: string[] }>;
  whyNotPeers: Array<{ text: string; citations: string[] }>;
  onCitationClick: (citationId: string) => void;
  citationsIndex: Record<string, Citation>;
}

export function WhyThisNotThatPanel({
  whyChooseTarget,
  whyNotPeers,
  onCitationClick,
  citationsIndex
}: WhyThisNotThatPanelProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Why choose A (or why not)</h3>
      <div className={styles.twoColumn}>
        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Why A wins</h4>
          <ul className={styles.list}>
            {whyChooseTarget.map((item, index) => (
              <li key={index} className={styles.listItem}>
                <span className={styles.text}>{item.text}</span>
                {item.citations.length > 0 && (
                  <div className={styles.citations}>
                    {item.citations.map((citationId) => {
                      const citation = citationsIndex[citationId];
                      return citation ? (
                        <button
                          key={citationId}
                          type="button"
                          onClick={() => onCitationClick(citationId)}
                          className={styles.citationChip}
                        >
                          {citation.label}
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Why B/C may be weaker</h4>
          <ul className={styles.list}>
            {whyNotPeers.map((item, index) => (
              <li key={index} className={styles.listItem}>
                <span className={styles.text}>{item.text}</span>
                {item.citations.length > 0 && (
                  <div className={styles.citations}>
                    {item.citations.map((citationId) => {
                      const citation = citationsIndex[citationId];
                      return citation ? (
                        <button
                          key={citationId}
                          type="button"
                          onClick={() => onCitationClick(citationId)}
                          className={styles.citationChip}
                        >
                          {citation.label}
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
