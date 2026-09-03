import { describe, expect, it } from 'vitest';
import {
  filterTimelineVisibleExpenses,
  shouldShowExpenseOnTimeline,
} from './filterTimelineVisibleExpenses';
import { type Expense } from '../../types/expense';

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
  const todayIso = '2026-03-05';

  it('hides template anchor when its date is excluded', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: dailyRule,
      recurrenceExcludedDates: ['2026-03-01'],
    });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });

    expect(shouldShowExpenseOnTimeline(template, todayIso)).toBe(false);
    expect(filterTimelineVisibleExpenses([template, instance], todayIso)).toEqual([instance]);
  });

  it('shows template anchor when its date is not excluded and not in the future', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const oneTime = makeExpense({ id: 'e1', date: '2026-03-05' });

    expect(shouldShowExpenseOnTimeline(template, todayIso)).toBe(true);
    expect(filterTimelineVisibleExpenses([template, oneTime], todayIso)).toHaveLength(2);
  });

  it('hides recurring templates with a future start date', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-08-01',
      recurrenceRule: dailyRule,
    });

    expect(shouldShowExpenseOnTimeline(template, todayIso)).toBe(false);
    expect(filterTimelineVisibleExpenses([template], todayIso)).toEqual([]);
  });

  it('hides scheduled one-time expenses', () => {
    const scheduled = makeExpense({ id: 's1', date: '2026-08-01', scheduled: true });
    const ledger = makeExpense({ id: 'e1', date: '2026-03-05' });

    expect(shouldShowExpenseOnTimeline(scheduled, todayIso)).toBe(false);
    expect(filterTimelineVisibleExpenses([scheduled, ledger], todayIso)).toEqual([ledger]);
  });

  it('shows materialized instances regardless of template excluded dates', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: dailyRule,
      recurrenceExcludedDates: ['2026-03-01'],
    });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });

    expect(shouldShowExpenseOnTimeline(instance, todayIso)).toBe(true);
  });
});
