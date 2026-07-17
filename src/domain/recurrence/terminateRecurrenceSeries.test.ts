import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { terminateRecurrenceSeries } from './terminateRecurrenceSeries';

const dailyRule = { type: 'daily' as const, interval: 1, occurrences: null };

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'id' | 'date'>): Expense {
  return {
    id: overrides.id,
    date: overrides.date,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 100,
    category: 'food.groceries',
    paymentMethod: 'cash',
    ...overrides,
  };
}

describe('terminateRecurrenceSeries', () => {
  it('caps template end date without removing instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance1 = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    const instance2 = makeExpense({ id: 'i2', date: '2026-07-15', recurrenceSeriesId: 't1' });

    const result = terminateRecurrenceSeries(
      [template, instance1, instance2],
      template,
      '2026-07-10',
    );

    expect(result).toHaveLength(3);
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-07-09');
    expect(result.find((e) => e.id === 'i1')).toBeDefined();
    expect(result.find((e) => e.id === 'i2')).toBeDefined();
  });

  it('uses earliest end date when template already has a cap', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-07-05',
    });

    const result = terminateRecurrenceSeries([template], template, '2026-07-10');
    expect(result[0].recurrenceEndDate).toBe('2026-07-05');
  });
});
