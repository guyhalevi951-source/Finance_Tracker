import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import {
  filterTimelineVisibleExpenses,
  shouldShowExpenseOnTimeline,
} from './filterTimelineVisibleExpenses';

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

describe('filterTimelineVisibleExpenses', () => {
  it('hides template anchor when its date is excluded', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: dailyRule,
      recurrenceExcludedDates: ['2026-03-01'],
    });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });

    expect(shouldShowExpenseOnTimeline(template)).toBe(false);
    expect(filterTimelineVisibleExpenses([template, instance])).toEqual([instance]);
  });

  it('shows template anchor when its date is not excluded', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const oneTime = makeExpense({ id: 'e1', date: '2026-03-05' });

    expect(shouldShowExpenseOnTimeline(template)).toBe(true);
    expect(filterTimelineVisibleExpenses([template, oneTime])).toHaveLength(2);
  });

  it('shows materialized instances regardless of template excluded dates', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: dailyRule,
      recurrenceExcludedDates: ['2026-03-01'],
    });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });

    expect(shouldShowExpenseOnTimeline(instance)).toBe(true);
  });
});
