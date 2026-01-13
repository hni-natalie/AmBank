import styles from './SentimentGauge.module.css';

interface SentimentGaugeProps {
  score: number; // -100 to 100
  label: string;
}

export function SentimentGauge({ score, label }: SentimentGaugeProps) {
  // Normalize score to 0-100 for gauge calculation
  // Assuming input score is -100 to 100, or 0 to 100.
  // The plan says mock data has overallSentimentScore: 78 (assuming 0-100 based on standard scoring, but plan mentioned -100 to 100 capability).
  // Let's assume the score passed in is -100 to +100 as per requested spec "range: -100 (very adverse) to +100 (very positive) OR 0–100"
  // If the score is > 100 or < -100, clamp it.
  
  // Let's normalize to 0-1 (0 = -100, 1 = +100) for rotation.
  // Actually, standard gauges usually go 0 to 100.
  // If input is -100 to 100:
  // normalized = (score + 100) / 200 -> 0 to 1
  
  // Let's support -100 to 100 range.
  const clampedScore = Math.max(-100, Math.min(100, score));
  const normalizedValue = (clampedScore + 100) / 200; // 0 to 1

  // Gauge rotation: -90deg to 90deg (semicircle)
  // 0% -> -90deg
  // 100% -> 90deg
  const rotation = normalizedValue * 180 - 90;

  let color = '#64748b'; // default
  if (clampedScore > 20) color = '#10b981'; // Green (Bullish)
  else if (clampedScore < -20) color = '#ef4444'; // Red (Bearish)
  else color = '#f59e0b'; // Amber (Neutral)

  return (
    <div className={styles.container}>
      <div className={styles.gaugeValues}>
         <span className={styles.minVal}>-100</span>
         <span className={styles.maxVal}>+100</span>
      </div>
      <div className={styles.gauge}>
        <svg viewBox="0 0 200 110" className={styles.svg}>
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Active Arc - colored segment based on score? 
              For a simple needle gauge, we often just show the needle. 
              Let's keeping it simple with just needle + colored text.
          */}
          
          {/* Needle */}
          <g transform={`rotate(${rotation}, 100, 100)`}>
            <polygon points="100,20 95,100 105,100" fill="#1e293b" />
            <circle cx="100" cy="100" r="8" fill="#1e293b" />
          </g>
        </svg>
        
        <div className={styles.scoreDisplay}>
          <div className={styles.scoreValue} style={{ color }}>
            {score > 0 ? '+' : ''}{score}
          </div>
          <div className={styles.scoreLabel} style={{ color }}>
            {label}
          </div>
        </div>
      </div>
       <div className={styles.subtext}>
        based on last 30 days news + filings
      </div>
    </div>
  );
}
