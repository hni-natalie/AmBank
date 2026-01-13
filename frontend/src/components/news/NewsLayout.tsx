import { ReactNode } from 'react';
import styles from './NewsLayout.module.css';

interface NewsLayoutProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
}

export function NewsLayout({ leftColumn, rightColumn }: NewsLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        {leftColumn}
      </div>
      <div className={styles.rightColumn}>
        {rightColumn}
      </div>
    </div>
  );
}
