import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { type SubBudgetRecord } from '../../types/budget';
import {
  capExpenseRecurrenceToSubBudgetEnd,
  capExpensesRecurrenceToSubBudgetEnd,
  resolveEffectiveRecurrenceEndDate,
  resolveSubBudgetEndDate,
  resolveSubBudgetWindow,
} from './subBudgetExpenseWindow';

const subBudget: SubBudgetRecord = {
  id: 'b1',
  name: { en: 'Trip', he: 'טיול' },
  totalAmount: 1000,
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
};

const template: Expense = {
  id: 't1',
  description: { en: 'Hotel', he: 'מלון' },
  amount: 100,
  category: 'food',
  date: '2026-08-01',
  paymentMethod: 'cash',
  budgetId: 'b1',
  recurrenceRule: { type: 'weekly', interval: 1, occurrences: null },
};

describe('subBudgetExpenseWindow', () => {
  it('resolves window by budget id', () => {
    expect(resolveSubBudgetWindow([subBudget], 'b1')).toEqual({
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });
    expect(resolveSubBudgetEndDate([subBudget], 'b1')).toBe('2026-08-31');
  });

  it('caps recurrence end date on expense', () => {
    const capped = capExpenseRecurrenceToSubBudgetEnd(template, '2026-08-31');
    expect(capped.recurrenceEndDate).toBe('2026-08-29');
    expect(capped.recurrenceRule?.occurrences).toBe(5);
  });

  it('uses earliest end between recurrence and sub-budget', () => {
    const withEarlierRecurrence = {
      ...template,
      recurrenceEndDate: '2026-08-15',
    };
    expect(resolveEffectiveRecurrenceEndDate(withEarlierRecurrence, '2026-08-31')).toBe(
      '2026-08-15',
    );
    expect(resolveEffectiveRecurrenceEndDate(template, '2026-08-31')).toBe('2026-08-31');
  });

  it('batch caps linked recurring expenses', () => {
    const other: Expense = { ...template, id: 't2', budgetId: 'other' };
    const capped = capExpensesRecurrenceToSubBudgetEnd([template, other], 'b1', '2026-08-31');
    expect(capped[0].recurrenceEndDate).toBe('2026-08-29');
    expect(capped[1].recurrenceEndDate).toBeUndefined();
  });
});
