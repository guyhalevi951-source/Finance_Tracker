import { describe, expect, it } from 'vitest';
import { computeOverviewForPeriodBudget } from './periodOverview';

describe('computeOverviewForPeriodBudget', () => {
  it('uses absolute period budget without monthly proration', () => {
    const overview = computeOverviewForPeriodBudget({
      periodBudget: 5000,
      expenses: [
        {
          id: '1',
          description: { en: 'Test', he: 'בדיקה' },
          amount: 1000,
          category: 'food',
          date: '2026-08-10',
          paymentMethod: 'cash',
        },
      ],
      range: { startIso: '2026-08-01', endIso: '2026-08-31' },
      todayIso: '2026-08-20',
    });

    expect(overview.periodBudget).toBe(5000);
    expect(overview.spent).toBe(1000);
    expect(overview.leftToSpend).toBe(4000);
  });
});
