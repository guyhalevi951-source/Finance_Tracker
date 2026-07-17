import { describe, it, expect } from 'vitest';
import { type Expense } from '../../types/expense';
import { countSeriesOccurrences } from './countSeriesOccurrences';

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'id'>): Expense {
  return {
    id: overrides.id,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 10,
    category: 'food.groceries',
    date: '2026-03-01',
    paymentMethod: 'cash',
    ...overrides,
  };
}

describe('countSeriesOccurrences', () => {
  it('counts template and generated instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01' });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });

    expect(countSeriesOccurrences([template, instance], 't1')).toBe(2);
  });

  it('does not count unrelated expenses', () => {
    const template = makeExpense({ id: 't1' });
    const other = makeExpense({ id: 'other' });

    expect(countSeriesOccurrences([template, other], 't1')).toBe(1);
  });
});
