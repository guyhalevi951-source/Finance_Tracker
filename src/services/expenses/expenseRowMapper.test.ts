import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { expenseRowToRaw, expenseToRow } from './expenseRowMapper';
import { migrateExpense } from './expenseRepository';

const expense: Expense = {
  id: 'exp-1',
  description: { en: 'Groceries', he: 'מכולת' },
  amount: 42.5,
  category: 'food.groceries',
  date: '2026-09-10',
  paymentMethod: 'cash',
  attachmentUrl: 'https://example.com/receipt.jpg',
  recurrenceRule: { type: 'weekly', interval: 1, occurrences: null },
  recurrenceSeriesId: 'series-1',
  recurrenceEndDate: '2026-12-31',
  recurrenceExcludedDates: ['2026-09-17'],
  scheduled: true,
  originalCategoryId: 'food',
  originalSubCategoryId: 'food.groceries',
  budgetId: 'budget-1',
};

describe('expense row mapper', () => {
  it('round-trips a full expense through snake_case rows', () => {
    const row = expenseToRow('11111111-1111-1111-1111-111111111111', expense);
    expect(row.user_id).toBe('11111111-1111-1111-1111-111111111111');
    expect(row.payment_method).toBe('cash');
    expect(row.budget_id).toBe('budget-1');
    expect(row.attachment_url).toBe(expense.attachmentUrl);

    const migrated = migrateExpense(expenseRowToRaw(row));
    expect(migrated).toEqual(expense);
  });

  it('omits optional fields when they are absent', () => {
    const minimal: Expense = {
      id: 'exp-2',
      description: { en: 'A', he: 'A' },
      amount: 1,
      category: 'other.miscellaneous',
      date: '2026-01-01',
      paymentMethod: 'creditCard',
    };
    const row = expenseToRow('user-1', minimal);
    expect(row.attachment_url).toBeNull();
    expect(row.recurrence_rule).toBeNull();
    expect(row.budget_id).toBeNull();
    expect(row.scheduled).toBe(false);
  });
});
