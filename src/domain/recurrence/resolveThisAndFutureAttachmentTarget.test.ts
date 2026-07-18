import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { applyRecurringBasicFieldUpdate } from './applyRecurringBasicFieldUpdate';
import { resolveThisAndFutureAttachmentTarget } from './resolveThisAndFutureAttachmentTarget';

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

const updatedFields = {
  description: { en: 'Updated', he: 'עודכן' },
  amount: 250,
  category: 'food.groceries' as const,
  paymentMethod: 'credit' as const,
};

describe('resolveThisAndFutureAttachmentTarget', () => {
  it('returns the same template when no series split occurs', () => {
    const todayIso = '2026-07-10';
    const template = makeExpense({
      id: 't1',
      date: todayIso,
      recurrenceRule: dailyRule,
    });
    const instance = makeExpense({ id: 'i1', date: '2026-07-11', recurrenceSeriesId: 't1' });

    const nextExpenses = applyRecurringBasicFieldUpdate(
      [template, instance],
      template,
      updatedFields,
      'thisAndFuture',
      todayIso,
    );

    const target = resolveThisAndFutureAttachmentTarget(nextExpenses, template, todayIso);

    expect(target.id).toBe('t1');
  });

  it('returns the successor template when a series split occurs', () => {
    const todayIso = '2026-07-10';
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: dailyRule,
    });
    const futureInstance = makeExpense({ id: 'i1', date: '2026-07-11', recurrenceSeriesId: 't1' });

    const nextExpenses = applyRecurringBasicFieldUpdate(
      [template, futureInstance],
      template,
      updatedFields,
      'thisAndFuture',
      todayIso,
    );

    const target = resolveThisAndFutureAttachmentTarget(nextExpenses, template, todayIso);
    const successor = nextExpenses.find(
      (expense) => expense.recurrenceRule !== undefined && expense.id !== 't1',
    );

    expect(target.id).toBe(successor?.id);
    expect(target.id).not.toBe('t1');
    expect(target.date).toBe(todayIso);
  });

  it('disambiguates successor via reassigned future instances when multiple templates share split date', () => {
    const todayIso = '2026-07-10';
    const templateA = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: dailyRule,
    });
    const templateB = makeExpense({
      id: 't2',
      date: '2026-07-01',
      recurrenceRule: dailyRule,
    });
    const futureA = makeExpense({ id: 'i1', date: '2026-07-11', recurrenceSeriesId: 't1' });

    const nextExpensesA = applyRecurringBasicFieldUpdate(
      [templateA, templateB, futureA],
      templateA,
      updatedFields,
      'thisAndFuture',
      todayIso,
    );

    const target = resolveThisAndFutureAttachmentTarget(nextExpensesA, templateA, todayIso);
    const successorA = nextExpensesA.find(
      (expense) =>
        expense.recurrenceRule !== undefined &&
        expense.id !== 't1' &&
        expense.id !== 't2',
    );

    expect(target.id).toBe(successorA?.id);
    expect(nextExpensesA.find((e) => e.id === 'i1')?.recurrenceSeriesId).toBe(successorA?.id);
  });
});
