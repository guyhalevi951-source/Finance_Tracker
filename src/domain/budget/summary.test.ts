import { describe, it, expect } from 'vitest';
import { computeBudgetSummary } from './summary';

describe('computeBudgetSummary', () => {
  it('computes correct totals with no float drift', () => {
    const result = computeBudgetSummary(1000, [0.1, 0.2]);
    expect(result.totalExpenses).toBe(0.3);
  });

  it('marks as over budget when expenses exceed budget', () => {
    const result = computeBudgetSummary(100, [60, 50]);
    expect(result.isOverBudget).toBe(true);
    expect(result.remaining).toBe(-10);
  });

  it('marks as not over budget when within limit', () => {
    const result = computeBudgetSummary(1000, [200, 300]);
    expect(result.isOverBudget).toBe(false);
    expect(result.remaining).toBe(500);
  });

  it('returns 0 percentage when budget is 0', () => {
    const result = computeBudgetSummary(0, [100]);
    expect(result.budgetPercentage).toBe(0);
    expect(result.isOverBudget).toBe(false);
  });

  it('handles empty expenses', () => {
    const result = computeBudgetSummary(500, []);
    expect(result.totalExpenses).toBe(0);
    expect(result.remaining).toBe(500);
    expect(result.isOverBudget).toBe(false);
  });

  it('computes budget percentage correctly', () => {
    const result = computeBudgetSummary(200, [100]);
    expect(result.budgetPercentage).toBe(50);
  });
});
