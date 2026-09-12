import { describe, expect, it } from 'vitest';
import { buildBudgetScopedTitle } from './buildBudgetScopedTitle';

describe('buildBudgetScopedTitle', () => {
  it('formats as page name then budget name', () => {
    expect(buildBudgetScopedTitle('Charts', 'Monthly Budget')).toBe(
      'Charts - Monthly Budget',
    );
    expect(buildBudgetScopedTitle('תרשימים', 'התקציב החודשי')).toBe(
      'תרשימים - התקציב החודשי',
    );
  });

  it('uses the same pattern for sub-budgets', () => {
    expect(buildBudgetScopedTitle('Expenses', 'Vacation')).toBe('Expenses - Vacation');
    expect(buildBudgetScopedTitle('הוצאות', 'חופשה')).toBe('הוצאות - חופשה');
  });
});
