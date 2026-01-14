import { ReactNode } from 'react';
import styles from './CompaniesLayout.module.css';

interface CompaniesLayoutProps {
  filtersPanel: ReactNode;
  table: ReactNode;
}

export function CompaniesLayout({ filtersPanel, table }: CompaniesLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.filtersColumn}>
        {filtersPanel}
      </div>
      <div className={styles.tableColumn}>
        {table}
      </div>
    </div>
  );
}
