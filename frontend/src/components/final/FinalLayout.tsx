import { ReactNode } from 'react';
import styles from './FinalLayout.module.css';

interface FinalLayoutProps {
  mainContent: ReactNode;
  sidePanel: ReactNode;
}

export function FinalLayout({ mainContent, sidePanel }: FinalLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.mainColumn}>
        {mainContent}
      </div>
      <div className={styles.sideColumn}>
        {sidePanel}
      </div>
    </div>
  );
}
