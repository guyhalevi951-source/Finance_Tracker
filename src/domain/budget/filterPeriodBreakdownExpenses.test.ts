import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { filterPeriodBreakdownExpenses } from './filterPeriodBreakdownExpenses';

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

const julyRange = { startIso: '2026-07-01', endIso: '2026-07-31' };

describe('filterPeriodBreakdownExpenses', () => {
  it('actual mode excludes future-dated and scheduled expenses', () => {
    const expenses = [
      makeExpense({ id: 'past', date: '2026-07-05', amount: 40 }),
      makeExpense({ id: 'future', date: '2026-07-20', amount: 25 }),
      makeExpense({ id: 'scheduled', date: '2026-07-18', amount: 10, scheduled: true }),
    ];

    const actual = filterPeriodBreakdownExpenses({
      expenses,
      range: julyRange,
      todayIso: '2026-07-10',
      mode: 'actual',
    });

    expect(actual.map((item) => item.id)).toEqual(['past']);
  });

  it('planned mode includes scheduled expenses and projected recurrences in range', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 15,
      recurrenceRule: dailyRule,
    });
    const scheduled = makeExpense({
      id: 's1',
      date: '2026-07-20',
      amount: 30,
      scheduled: true,
    });

    const planned = filterPeriodBreakdownExpenses({
      expenses: [template, scheduled],
      range: julyRange,
      todayIso: '2026-07-10',
      mode: 'planned',
    });

    expect(planned.some((item) => item.id === 't1')).toBe(true);
    expect(planned.some((item) => item.id === 's1')).toBe(true);
    expect(planned.some((item) => item.id === 't1:2026-07-11')).toBe(true);
    expect(planned.filter((item) => item.id.startsWith('t1:')).length).toBeGreaterThan(0);
  });

  it('actual mode does not include projected recurrences', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 15,
      recurrenceRule: dailyRule,
    });

    const actual = filterPeriodBreakdownExpenses({
      expenses: [template],
      range: julyRange,
      todayIso: '2026-07-10',
      mode: 'actual',
    });

    expect(actual.every((item) => !item.id.includes(':'))).toBe(true);
    expect(actual.map((item) => item.id)).toEqual(['t1']);
  });
});
