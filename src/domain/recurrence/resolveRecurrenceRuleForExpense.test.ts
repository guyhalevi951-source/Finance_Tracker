import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { resolveRecurrenceRuleForExpense } from './resolveRecurrenceRuleForExpense';

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

describe('resolveRecurrenceRuleForExpense', () => {
  it('returns rule from template expense', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    expect(resolveRecurrenceRuleForExpense([template], template)).toEqual(dailyRule);
  });

  it('returns rule from series template for generated instance', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-07-05', recurrenceSeriesId: 't1' });
    expect(resolveRecurrenceRuleForExpense([template, instance], instance)).toEqual(dailyRule);
  });

  it('returns undefined for non-recurring expense', () => {
    const expense = makeExpense({ id: 'e1', date: '2026-07-01' });
    expect(resolveRecurrenceRuleForExpense([expense], expense)).toBeUndefined();
  });
});
