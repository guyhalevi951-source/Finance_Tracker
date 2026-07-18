import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { applyBulkSeriesDelete } from './applyBulkSeriesDelete';

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

describe('applyBulkSeriesDelete', () => {
  const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
  const i2 = makeExpense({ id: 'i2', date: '2026-07-02', recurrenceSeriesId: 't1' });
  const i3 = makeExpense({ id: 'i3', date: '2026-07-03', recurrenceSeriesId: 't1' });
  const i5 = makeExpense({ id: 'i5', date: '2026-07-05', recurrenceSeriesId: 't1' });
  const i6 = makeExpense({ id: 'i6', date: '2026-07-06', recurrenceSeriesId: 't1' });
  const i7 = makeExpense({ id: 'i7', date: '2026-07-07', recurrenceSeriesId: 't1' });
  const otherSeries = makeExpense({
    id: 't2',
    date: '2026-07-01',
    recurrenceRule: dailyRule,
  });
  const otherInstance = makeExpense({
    id: 'iOther',
    date: '2026-07-02',
    recurrenceSeriesId: 't2',
  });

  const baseExpenses = [template, i2, i3, i5, i6, i7, otherSeries, otherInstance];
  const selected = [i2, i5];

  it('selectedOnly removes only selected instances and leaves in-between and future untouched', () => {
    const result = applyBulkSeriesDelete(baseExpenses, selected, 'selectedOnly');

    expect(result.find((e) => e.id === 'i2')).toBeUndefined();
    expect(result.find((e) => e.id === 'i5')).toBeUndefined();
    expect(result.find((e) => e.id === 'i3')).toBeDefined();
    expect(result.find((e) => e.id === 'i6')).toBeDefined();
    expect(result.find((e) => e.id === 'i7')).toBeDefined();
    expect(result.find((e) => e.id === 't1')?.recurrenceExcludedDates).toEqual(
      expect.arrayContaining(['2026-07-02', '2026-07-05']),
    );
    expect(result.find((e) => e.id === 't2')).toBeDefined();
    expect(result.find((e) => e.id === 'iOther')).toBeDefined();
  });

  it('selectedPlusFutureFromLatest removes selected and future from latest while preserving in-between', () => {
    const result = applyBulkSeriesDelete(
      baseExpenses,
      selected,
      'selectedPlusFutureFromLatest',
    );

    expect(result.find((e) => e.id === 'i2')).toBeUndefined();
    expect(result.find((e) => e.id === 'i3')).toBeDefined();
    expect(result.find((e) => e.id === 'i5')).toBeUndefined();
    expect(result.find((e) => e.id === 'i6')).toBeUndefined();
    expect(result.find((e) => e.id === 'i7')).toBeUndefined();
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-07-04');
    expect(result.find((e) => e.id === 't2')).toBeDefined();
  });

  it('fromEarliestSelected removes entire chain from earliest selected onward', () => {
    const result = applyBulkSeriesDelete(baseExpenses, selected, 'fromEarliestSelected');

    expect(result.find((e) => e.id === 'i2')).toBeUndefined();
    expect(result.find((e) => e.id === 'i3')).toBeUndefined();
    expect(result.find((e) => e.id === 'i5')).toBeUndefined();
    expect(result.find((e) => e.id === 'i6')).toBeUndefined();
    expect(result.find((e) => e.id === 'i7')).toBeUndefined();
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-07-01');
    expect(result.find((e) => e.id === 't2')).toBeDefined();
    expect(result.find((e) => e.id === 'iOther')).toBeDefined();
  });

  it('throws when fewer than two selected expenses are provided', () => {
    expect(() => applyBulkSeriesDelete(baseExpenses, [i2], 'selectedOnly')).toThrow();
  });
});
