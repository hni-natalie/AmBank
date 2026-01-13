import { ReactNode } from 'react';
import styles from './CompareLayout.module.css';

interface CompareLayoutProps {
  cards: ReactNode;
  table: ReactNode;
  whyPanel: ReactNode;
}

export function CompareLayout({ cards, table, whyPanel }: CompareLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.cardsSection}>{cards}</div>
      <div className={styles.tableSection}>{table}</div>
      <div className={styles.whySection}>{whyPanel}</div>
    </div>
  );
}
