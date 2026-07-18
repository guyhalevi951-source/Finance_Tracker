import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { sortExpensesByDateDescending } from './sortExpensesByDateDescending';

function makeExpense(id: string, date: string): Expense {
  return {
    id,
    date,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 100,
    category: 'food.groceries',
    paymentMethod: 'cash',
  };
}

describe('sortExpensesByDateDescending', () => {
  it('orders latest date first', () => {
    const a = makeExpense('a', '2026-07-14');
    const b = makeExpense('b', '2026-07-16');
    const c = makeExpense('c', '2026-07-15');

    expect(sortExpensesByDateDescending([a, b, c]).map((e) => e.date)).toEqual([
      '2026-07-16',
      '2026-07-15',
      '2026-07-14',
    ]);
  });
});
