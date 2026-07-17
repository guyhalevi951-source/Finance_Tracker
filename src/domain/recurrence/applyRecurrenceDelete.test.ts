import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { applyRecurrenceDelete } from './applyRecurrenceDelete';

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

describe('applyRecurrenceDelete', () => {
  it('removes one-off expense', () => {
    const expense = makeExpense({ id: 'e1', date: '2026-03-01' });
    const result = applyRecurrenceDelete([expense], expense, 'instanceOnly');
    expect(result).toHaveLength(0);
  });

  it('instanceOnly on generated instance adds excluded date to template', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const result = applyRecurrenceDelete([template, instance], instance, 'instanceOnly');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
    expect(result[0].recurrenceExcludedDates).toEqual(['2026-03-02']);
  });

  it('instanceOnly on template promotes earliest successor', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const instance1 = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const instance2 = makeExpense({ id: 'i2', date: '2026-03-03', recurrenceSeriesId: 't1' });
    const result = applyRecurrenceDelete(
      [template, instance1, instance2],
      template,
      'instanceOnly',
    );

    expect(result.find((e) => e.id === 't1')).toBeUndefined();
    const promoted = result.find((e) => e.id === 'i1');
    expect(promoted?.recurrenceRule).toEqual(dailyRule);
    expect(promoted?.recurrenceSeriesId).toBeUndefined();
    expect(promoted?.recurrenceExcludedDates).toEqual(['2026-03-01']);
    expect(result.find((e) => e.id === 'i2')?.recurrenceSeriesId).toBe('i1');
  });

  it('instanceOnly on template without instances removes template', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const result = applyRecurrenceDelete([template], template, 'instanceOnly');
    expect(result).toHaveLength(0);
  });

  it('thisAndFuture from instance caps template and removes future instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const split = makeExpense({ id: 'i2', date: '2026-03-05', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i3', date: '2026-03-06', recurrenceSeriesId: 't1' });
    const result = applyRecurrenceDelete(
      [template, past, split, future],
      split,
      'thisAndFuture',
    );

    expect(result.find((e) => e.id === 'i2')).toBeUndefined();
    expect(result.find((e) => e.id === 'i3')).toBeUndefined();
    expect(result.find((e) => e.id === 'i1')).toBeDefined();
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-03-04');
  });

  it('thisAndFuture from template removes template and future instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-02-28', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i2', date: '2026-03-05', recurrenceSeriesId: 't1' });
    const result = applyRecurrenceDelete(
      [template, past, future],
      template,
      'thisAndFuture',
    );

    expect(result.find((e) => e.id === 't1')).toBeUndefined();
    expect(result.find((e) => e.id === 'i2')).toBeUndefined();
    expect(result.find((e) => e.id === 'i1')).toBeDefined();
  });
});
