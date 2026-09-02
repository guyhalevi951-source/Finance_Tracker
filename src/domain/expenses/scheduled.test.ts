import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import {
  isScheduledOneTimeExpense,
  listScheduledOneTimeExpenses,
  materializeDueScheduledExpenses,
  shouldScheduleOneTimeExpense,
} from './scheduled';

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

describe('shouldScheduleOneTimeExpense', () => {
  const todayIso = '2026-07-19';

  it('returns true for one-time future date', () => {
    expect(
      shouldScheduleOneTimeExpense({ date: '2026-07-20', hasRecurrenceRule: false }, todayIso),
    ).toBe(true);
  });

  it('returns false for today or past', () => {
    expect(
      shouldScheduleOneTimeExpense({ date: todayIso, hasRecurrenceRule: false }, todayIso),
    ).toBe(false);
    expect(
      shouldScheduleOneTimeExpense({ date: '2026-07-10', hasRecurrenceRule: false }, todayIso),
    ).toBe(false);
  });

  it('returns false when recurrence rule is present', () => {
    expect(
      shouldScheduleOneTimeExpense({ date: '2026-08-01', hasRecurrenceRule: true }, todayIso),
    ).toBe(false);
  });
});

describe('isScheduledOneTimeExpense', () => {
  it('identifies scheduled one-time rows', () => {
    expect(
      isScheduledOneTimeExpense(makeExpense({ id: 'a', date: '2026-08-01', scheduled: true })),
    ).toBe(true);
  });

  it('rejects recurring templates and ledger rows', () => {
    expect(
      isScheduledOneTimeExpense(
        makeExpense({
          id: 'b',
          date: '2026-08-01',
          scheduled: true,
          recurrenceRule: { type: 'monthly', interval: 1, occurrences: null },
        }),
      ),
    ).toBe(false);
    expect(isScheduledOneTimeExpense(makeExpense({ id: 'c', date: '2026-08-01' }))).toBe(false);
  });
});

describe('listScheduledOneTimeExpenses', () => {
  it('returns scheduled one-time rows sorted by date', () => {
    const expenses = [
      makeExpense({ id: 'b', date: '2026-09-01', scheduled: true }),
      makeExpense({ id: 'a', date: '2026-08-01', scheduled: true }),
      makeExpense({ id: 'c', date: '2026-07-01' }),
    ];

    expect(listScheduledOneTimeExpenses(expenses).map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('materializeDueScheduledExpenses', () => {
  const todayIso = '2026-07-19';

  it('strips scheduled flag when date is due', () => {
    const scheduled = makeExpense({ id: 's1', date: todayIso, scheduled: true });
    const future = makeExpense({ id: 's2', date: '2026-08-01', scheduled: true });

    const result = materializeDueScheduledExpenses([scheduled, future], todayIso);

    expect(result[0].scheduled).toBeUndefined();
    expect(result[1].scheduled).toBe(true);
    expect(result[0].id).toBe('s1');
  });

  it('returns same array reference when nothing changes', () => {
    const expenses = [makeExpense({ id: 'e1', date: '2026-08-01', scheduled: true })];
    expect(materializeDueScheduledExpenses(expenses, todayIso)).toBe(expenses);
  });
});
