import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { MASTER_BUDGET_ID } from './constants';
import { filterExpensesByBudget } from './filterExpensesByBudget';

function makeExpense(id: string, budgetId?: string): Expense {
  return {
    id,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 50,
    category: 'food',
    date: '2026-08-01',
    paymentMethod: 'cash',
    ...(budgetId ? { budgetId } : {}),
  };
}

describe('single expense object across budget contexts', () => {
  it('shows the same expense in master after sub-budget filter mutation', () => {
    const linked = makeExpense('linked', 'sub1');
    const masterView = filterExpensesByBudget([linked], MASTER_BUDGET_ID);
    const subView = filterExpensesByBudget([linked], 'sub1');

    expect(masterView).toHaveLength(1);
    expect(subView).toHaveLength(1);
    expect(masterView[0]).toBe(subView[0]);
  });
});
