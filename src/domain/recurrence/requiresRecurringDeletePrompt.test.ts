import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { requiresRecurringDeletePrompt } from './requiresRecurringDeletePrompt';
import { terminateRecurrenceSeries } from './terminateRecurrenceSeries';

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

describe('requiresRecurringDeletePrompt', () => {
  it('returns false for non-recurring expenses', () => {
    const expense = makeExpense({ id: 'e1', date: '2026-03-01' });
    expect(requiresRecurringDeletePrompt([expense], expense, '2026-03-01')).toBe(false);
  });

  it('returns true when a same-series instance exists past recurrenceEndDate', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-03-04',
    });
    const historical = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i2', date: '2026-03-10', recurrenceSeriesId: 't1' });

    expect(
      requiresRecurringDeletePrompt(
        [template, historical, future],
        historical,
        '2026-03-10',
      ),
    ).toBe(true);
  });

  it('returns false for the last visible instance so delete uses silent instanceOnly path', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-03-05',
    });
    const lastVisible = makeExpense({ id: 'i1', date: '2026-03-05', recurrenceSeriesId: 't1' });

    expect(
      requiresRecurringDeletePrompt([template, lastVisible], lastVisible, '2026-03-05'),
    ).toBe(false);
  });

  it('returns true when last visible instance still has projected scheduled occurrences', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 4 },
    });
    const lastVisible = makeExpense({ id: 'i1', date: '2026-03-03', recurrenceSeriesId: 't1' });

    expect(
      requiresRecurringDeletePrompt([template, lastVisible], lastVisible, '2026-03-03'),
    ).toBe(true);
  });

  it('returns true when additional future occurrences exist within the active window', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const split = makeExpense({ id: 'i1', date: '2026-03-05', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i2', date: '2026-03-06', recurrenceSeriesId: 't1' });

    expect(
      requiresRecurringDeletePrompt([template, split, future], split, '2026-03-05'),
    ).toBe(true);
  });

  it('returns false for last in-window instance after Settings terminate', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const withinWindow = makeExpense({ id: 'i2', date: '2026-03-08', recurrenceSeriesId: 't1' });
    const todayIso = '2026-03-10';

    const terminated = terminateRecurrenceSeries([template, withinWindow], template, todayIso);

    expect(requiresRecurringDeletePrompt(terminated, withinWindow, todayIso)).toBe(false);
  });
});
