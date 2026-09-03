import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { computeProjectedFutureOccurrenceDates } from '../recurrence/computeProjectedFutureOccurrenceDates';
import { computeDailyExpenseBreakdown } from './computeDailyExpenseBreakdown';

const dailyRule = { type: 'daily' as const, interval: 1, occurrences: null };

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'id' | 'date'>): Expense {
  return {
    id: overrides.id,
    date: overrides.date,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 100,
    category: 'food',
    paymentMethod: 'cash',
    ...overrides,
  };
}

describe('computeProjectedFutureOccurrenceDates', () => {
  it('returns a global chronological sequence capped by remaining occurrences', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 30,
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 5 },
    });

    expect(computeProjectedFutureOccurrenceDates([template], template, '2026-07-10')).toEqual([
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
    ]);
  });

  it('returns an empty array when remaining occurrences is zero', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 30,
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 3 },
    });
    const instance1 = makeExpense({
      id: 'i1',
      date: '2026-07-02',
      amount: 30,
      recurrenceSeriesId: 't1',
    });
    const instance2 = makeExpense({
      id: 'i2',
      date: '2026-07-03',
      amount: 30,
      recurrenceSeriesId: 't1',
    });

    expect(
      computeProjectedFutureOccurrenceDates(
        [template, instance1, instance2],
        template,
        '2026-07-10',
      ),
    ).toEqual([]);
  });
});

describe('computeDailyExpenseBreakdown', () => {
  const julyRange = { startIso: '2026-07-01', endIso: '2026-07-31' };

  it('classifies past expenses as actual only', () => {
    const expenses = [makeExpense({ id: 'a', date: '2026-07-05', amount: 50 })];
    const breakdown = computeDailyExpenseBreakdown(expenses, julyRange, '2026-07-20');

    const day = breakdown.find((entry) => entry.dateIso === '2026-07-05');
    expect(day?.actualExpenses).toBe(50);
    expect(day?.futureExpenses).toBe(0);
    expect(day?.total).toBe(50);
  });

  it('classifies scheduled one-time expenses as future only', () => {
    const expenses = [
      makeExpense({ id: 's1', date: '2026-07-25', amount: 99, scheduled: true }),
    ];
    const breakdown = computeDailyExpenseBreakdown(expenses, julyRange, '2026-07-10');

    const day = breakdown.find((entry) => entry.dateIso === '2026-07-25');
    expect(day?.actualExpenses).toBe(0);
    expect(day?.futureExpenses).toBe(99);
    expect(day?.total).toBe(99);
  });

  it('projects future recurring dates not yet materialized', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 30,
      recurrenceRule: dailyRule,
    });
    const breakdown = computeDailyExpenseBreakdown([template], julyRange, '2026-07-10');

    const projectedDay = breakdown.find((entry) => entry.dateIso === '2026-07-15');
    expect(projectedDay?.futureExpenses).toBe(30);
    expect(projectedDay?.actualExpenses).toBe(0);
  });

  it('does not double-count when a recurring instance already exists', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 30,
      recurrenceRule: dailyRule,
    });
    const instance = makeExpense({
      id: 'i1',
      date: '2026-07-15',
      amount: 30,
      recurrenceSeriesId: 't1',
    });
    const breakdown = computeDailyExpenseBreakdown(
      [template, instance],
      julyRange,
      '2026-07-10',
    );

    const day = breakdown.find((entry) => entry.dateIso === '2026-07-15');
    expect(day?.futureExpenses).toBe(30);
    expect(day?.total).toBe(30);
  });

  it('fills zero-value days across the full range', () => {
    const breakdown = computeDailyExpenseBreakdown([], julyRange, '2026-07-10');
    expect(breakdown).toHaveLength(31);
    expect(breakdown.every((day) => day.total === 0)).toBe(true);
  });

  it('projects only up to remaining occurrence limit', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 30,
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 5 },
    });
    const breakdown = computeDailyExpenseBreakdown([template], julyRange, '2026-07-10');

    const futureDays = breakdown.filter((day) => day.futureExpenses > 0);
    expect(futureDays).toHaveLength(4);
    expect(futureDays.map((day) => day.dateIso)).toEqual([
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
    ]);
    expect(breakdown.find((day) => day.dateIso === '2026-07-15')?.futureExpenses).toBe(0);
  });

  it('does not project when remaining occurrences is zero', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 30,
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 3 },
    });
    const instance1 = makeExpense({
      id: 'i1',
      date: '2026-07-02',
      amount: 30,
      recurrenceSeriesId: 't1',
    });
    const instance2 = makeExpense({
      id: 'i2',
      date: '2026-07-03',
      amount: 30,
      recurrenceSeriesId: 't1',
    });
    const breakdown = computeDailyExpenseBreakdown(
      [template, instance1, instance2],
      julyRange,
      '2026-07-10',
    );

    expect(breakdown.every((day) => day.futureExpenses === 0)).toBe(true);
  });

  it('does not repeat projected occurrences in later months after global limit is exhausted', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 30,
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 5 },
    });
    const augustRange = { startIso: '2026-08-01', endIso: '2026-08-31' };
    const julyBreakdown = computeDailyExpenseBreakdown([template], julyRange, '2026-07-10');
    const augustBreakdown = computeDailyExpenseBreakdown([template], augustRange, '2026-07-10');

    const julyFuture = julyBreakdown.filter((day) => day.futureExpenses > 0);
    expect(julyFuture).toHaveLength(4);
    expect(julyFuture.map((day) => day.dateIso)).toEqual([
      '2026-07-11',
      '2026-07-12',
      '2026-07-13',
      '2026-07-14',
    ]);

    const augustFuture = augustBreakdown.filter((day) => day.futureExpenses > 0);
    expect(augustFuture).toHaveLength(0);
  });

  it('does not project from inactive templates past recurrence end date', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 30,
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-07-05',
    });
    const breakdown = computeDailyExpenseBreakdown([template], julyRange, '2026-07-10');

    expect(breakdown.every((day) => day.futureExpenses === 0)).toBe(true);
  });
});
