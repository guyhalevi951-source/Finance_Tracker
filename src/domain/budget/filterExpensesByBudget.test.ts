import { describe, expect, it } from 'vitest';
import { type SubBudgetRecord } from '../../types/budget';
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

function makeSubBudget(id: string, includeInMonthlyBudget: boolean): SubBudgetRecord {
  return {
    id,
    kind: 'temporary',
    name: { en: id, he: id },
    totalAmount: 100,
    includeInMonthlyBudget,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    sortOrder: 0,
    createdAt: '2026-07-01T00:00:00.000Z',
  };
}

describe('filterExpensesByBudget', () => {
  const expenses = [makeExpense('1'), makeExpense('2', 'sub1'), makeExpense('3', 'sub2')];
  const linkedOnly = [makeSubBudget('sub1', true), makeSubBudget('sub2', true)];

  it('returns all expenses for master when every sub-budget is linked', () => {
    expect(filterExpensesByBudget(expenses, MASTER_BUDGET_ID, linkedOnly)).toHaveLength(3);
  });

  it('returns all expenses for master when no sub-budgets exist', () => {
    expect(filterExpensesByBudget(expenses, MASTER_BUDGET_ID, [])).toHaveLength(3);
  });

  it('excludes isolated sub-budget expenses from master', () => {
    const withIsolated = [makeSubBudget('sub1', true), makeSubBudget('sub2', false)];
    expect(
      filterExpensesByBudget(expenses, MASTER_BUDGET_ID, withIsolated).map((e) => e.id),
    ).toEqual(['1', '2']);
  });

  it('excludes isolated fixed budgets from master too', () => {
    const fixedIsolated: SubBudgetRecord = {
      id: 'sub2',
      kind: 'fixed',
      name: { en: 'Fixed', he: 'קבוע' },
      totalAmount: 100,
      includeInMonthlyBudget: false,
      monthOverrides: {},
      sortOrder: 0,
      createdAt: '2026-07-01T00:00:00.000Z',
    };
    expect(
      filterExpensesByBudget(expenses, MASTER_BUDGET_ID, [fixedIsolated]).map((e) => e.id),
    ).toEqual(['1', '2']);
  });

  it('returns only matching sub-budget expenses regardless of the link flag', () => {
    const withIsolated = [makeSubBudget('sub1', false)];
    expect(filterExpensesByBudget(expenses, 'sub1', withIsolated).map((e) => e.id)).toEqual([
      '2',
    ]);
  });
});
