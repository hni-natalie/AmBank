/**
 * Utility functions for comparing and normalizing company metrics
 */

/**
 * Normalize values where higher is better (0-100 scale)
 * Formula: (value - min) / (max - min) * 100
 */
export function normalizeHigherBetter(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [100];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) return values.map(() => 100);

  return values.map((value) => ((value - min) / (max - min)) * 100);
}

/**
 * Normalize values where lower is better (0-100 scale, inverted)
 * Formula: (max - value) / (max - min) * 100
 */
export function normalizeLowerBetter(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [100];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) return values.map(() => 100);

  return values.map((value) => ((max - value) / (max - min)) * 100);
}

/**
 * Find the index of the best value
 * @param values Array of values
 * @param mode 'higher' for higher is better, 'lower' for lower is better
 * @returns Index of the best value, or -1 if not found
 */
export function pickBestIndex(values: number[], mode: 'higher' | 'lower'): number {
  if (values.length === 0) return -1;

  if (mode === 'higher') {
    return values.indexOf(Math.max(...values));
  } else {
    return values.indexOf(Math.min(...values));
  }
}

/**
 * Calculate breakdown scores from company data
 * This is a mock calculation - in real app, this would come from backend
 */
export function calculateBreakdown(
  _confidence: number,
  kpis: { roe: number; debtEquity: number; patMargin: number; sentiment30d: number }
): { fundamentals: number; news: number; riskPenalty: number } {
  // Mock calculation:
  // Fundamentals: weighted average of ROE, PAT Margin, Debt/Equity (inverted)
  const fundamentalsScore = (kpis.roe * 0.4 + kpis.patMargin * 0.3 + (1 / (1 + kpis.debtEquity)) * 100 * 0.3);
  
  // News: sentiment score
  const newsScore = kpis.sentiment30d;
  
  // Risk penalty: based on debt/equity (higher debt = higher penalty)
  const riskPenalty = Math.max(0, (kpis.debtEquity - 0.3) * 20); // Penalty if D/E > 0.3
  
  return {
    fundamentals: Math.round(fundamentalsScore),
    news: newsScore,
    riskPenalty: Math.round(riskPenalty)
  };
}
