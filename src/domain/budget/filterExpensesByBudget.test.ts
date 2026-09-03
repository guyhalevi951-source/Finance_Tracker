import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { MASTER_BUDGET_ID } from './constants';
import { filterExpensesByBudget } from './filterExpensesByBudget';

function makeExpense(id: string, budgetId?: string): Expense {
  return {
    id,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 10,
    category: 'food',
    date: '2026-08-01',
    paymentMethod: 'cash',
    ...(budgetId ? { budgetId } : {}),
  };
}

describe('filterExpensesByBudget', () => {
  const expenses = [makeExpense('1'), makeExpense('2', 'sub1'), makeExpense('3', 'sub2')];

  it('returns all expenses for master', () => {
    expect(filterExpensesByBudget(expenses, MASTER_BUDGET_ID)).toHaveLength(3);
  });

  it('returns only matching sub-budget expenses', () => {
    expect(filterExpensesByBudget(expenses, 'sub1').map((e) => e.id)).toEqual(['2']);
  });
});
