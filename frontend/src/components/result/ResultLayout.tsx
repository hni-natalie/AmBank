import { ReactNode } from 'react';
import styles from './ResultLayout.module.css';

interface ResultLayoutProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
}

export function ResultLayout({ leftColumn, rightColumn }: ResultLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>{leftColumn}</div>
      <div className={styles.rightColumn}>{rightColumn}</div>
    </div>
  );
}
