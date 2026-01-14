import { useState, ReactNode } from 'react';
import styles from './DetailsAccordion.module.css';

interface DetailsAccordionProps {
  title: string | ReactNode;
  count?: number; // Optional count badge
  defaultOpen?: boolean;
  children: ReactNode;
}

export function DetailsAccordion({ title, count, defaultOpen = false, children }: DetailsAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.container}>
      <button 
        className={styles.header} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.headerLeft}>
           <span className={`${styles.icon} ${isOpen ? styles.rotated : ''}`}>▶</span>
           <span className={styles.title}>{title}</span>
        </div>
        {count !== undefined && <span className={styles.badge}>{count}</span>}
      </button>
      
      {isOpen && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
}
