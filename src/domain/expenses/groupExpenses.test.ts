import { describe, it, expect } from 'vitest';
import { groupExpensesByDate } from './groupByDate';
import { groupExpensesByCategory } from './groupByCategory';
import type { Expense } from '../../types/expense';

const makeExpense = (overrides: Partial<Expense>): Expense => ({
  id: '1',
  description: { en: 'Test', he: 'Test' },
  amount: 10,
  category: 'food',
  date: '2026-07-10',
  paymentMethod: 'cash',
  ...overrides,
});

describe('groupExpensesByDate', () => {
  it('groups by date and sums totals', () => {
    const groups = groupExpensesByDate([
      makeExpense({ id: 'a', date: '2026-07-10', amount: 10 }),
      makeExpense({ id: 'b', date: '2026-07-10', amount: 20 }),
      makeExpense({ id: 'c', date: '2026-07-09', amount: 5 }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].date).toBe('2026-07-10');
    expect(groups[0].total).toBe(30);
    expect(groups[1].date).toBe('2026-07-09');
  });
});

describe('groupExpensesByCategory', () => {
  it('groups by category and sums totals', () => {
    const groups = groupExpensesByCategory([
      makeExpense({ id: 'a', category: 'food', amount: 10 }),
      makeExpense({ id: 'b', category: 'food', amount: 15 }),
      makeExpense({ id: 'c', category: 'rent', amount: 100 }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].categoryId).toBe('rent');
    expect(groups[0].total).toBe(100);
    expect(groups[1].categoryId).toBe('food');
    expect(groups[1].total).toBe(25);
  });
});
