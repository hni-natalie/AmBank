import styles from './ContextPanel.module.css';

interface ContextItem {
  label: string;
  status: 'positive' | 'neutral' | 'negative';
}

interface ContextPanelProps {
  title: string;
  icon: string;
  items: ContextItem[];
}

export function ContextPanel({ title, icon, items }: ContextPanelProps) {
  const getStatusColor = (status: 'positive' | 'neutral' | 'negative') => {
    switch (status) {
      case 'positive': return '#10b981'; // green-500
      case 'neutral': return '#f59e0b'; // amber-500
      case 'negative': return '#ef4444'; // red-500
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <h3 className={styles.title}>{title}</h3>
      </div>
      
      <div className={styles.list}>
        {items.map((item, idx) => (
          <div key={idx} className={styles.item}>
            <span className={styles.itemLabel}>{item.label}</span>
            <div 
              className={styles.statusIndicator} 
              style={{ backgroundColor: getStatusColor(item.status) }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
