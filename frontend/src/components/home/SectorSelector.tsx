import styles from './SectorSelector.module.css';

interface SectorSelectorProps {
  selectedSector: string;
  onSectorChange: (sector: string) => void;
}

const sectors = [
	"Technology",
	"Financial Services",
	"Health Care",
	"Energy",
	"Consumer Products & Services",
	"Industrial Products & Services",
	"Construction",
	"Property",
	"Plantation",
	"Telecommunications & Media",
	"Transportation & Logistics",
	"Utilities",
	"Real Estate Investment Trusts",
  ];

export function SectorSelector({ selectedSector, onSectorChange }: SectorSelectorProps) {
  return (
    <div className={styles.container}>
      <label htmlFor="sector-select" className={styles.label}>
        Select Sector:
      </label>
      <select
        id="sector-select"
        value={selectedSector}
        onChange={(e) => onSectorChange(e.target.value)}
        className={styles.dropdown}
      >
        <option value="">-- Choose a sector --</option>
        {sectors.map((sector) => (
          <option key={sector} value={sector}>
            {sector}
          </option>
        ))}
      </select>
      {selectedSector && (
        <div className={styles.pill}>
          {selectedSector}
        </div>
      )}
    </div>
  );
}
