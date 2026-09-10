import { describe, expect, it } from 'vitest';
import { shouldShowOverviewBudgetRemainder } from './shouldShowOverviewBudgetRemainder';

describe('shouldShowOverviewBudgetRemainder', () => {
  it('hides remainder in weekly view', () => {
    expect(shouldShowOverviewBudgetRemainder('weekly')).toBe(false);
  });

  it('shows remainder in monthly and daily view', () => {
    expect(shouldShowOverviewBudgetRemainder('monthly')).toBe(true);
    expect(shouldShowOverviewBudgetRemainder('daily')).toBe(true);
  });
});
