import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { collectSubBudgetExpenseIds, detachExpensesFromBudget } from './deleteSubBudgetPolicy';

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

describe('deleteSubBudgetPolicy', () => {
  const expenses = [makeExpense('1'), makeExpense('2', 'sub1'), makeExpense('3', 'sub1')];

  it('collects expense ids for a sub-budget', () => {
    expect(collectSubBudgetExpenseIds(expenses, 'sub1')).toEqual(['2', '3']);
  });

  it('detaches budgetId while preserving expenses', () => {
    const detached = detachExpensesFromBudget(expenses, 'sub1');
    expect(detached).toHaveLength(3);
    expect(detached.find((e) => e.id === '2')?.budgetId).toBeUndefined();
    expect(detached.find((e) => e.id === '1')).toBeDefined();
  });
});
