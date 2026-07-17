import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { applyRecurrenceChangeOnEdit } from './applyRecurrenceChangeOnEdit';

const dailyRule = { type: 'daily' as const, interval: 1 };
const weeklyRule = { type: 'weekly' as const, interval: 1, customDays: [] as number[] };

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

describe('applyRecurrenceChangeOnEdit', () => {
  it('converts one-off expense to recurring template', () => {
    const expense = makeExpense({ id: 'e1', date: '2026-03-01' });
    const result = applyRecurrenceChangeOnEdit([expense], expense, dailyRule);
    const updated = result.find((e) => e.id === 'e1');

    expect(updated?.recurrenceRule).toEqual(dailyRule);
    expect(updated?.recurrenceSeriesId).toBeUndefined();
  });

  it('removes recurrence from template and deletes generated instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const result = applyRecurrenceChangeOnEdit([template, instance], template, null);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
    expect(result[0].recurrenceRule).toBeUndefined();
  });

  it('updates template rule and removes future generated instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const future = makeExpense({ id: 'i1', date: '2026-03-05', recurrenceSeriesId: 't1' });
    const updatedTemplate = { ...template, amount: 200 };
    const result = applyRecurrenceChangeOnEdit([template, future], updatedTemplate, weeklyRule);

    expect(result).toHaveLength(1);
    expect(result[0].recurrenceRule).toEqual(weeklyRule);
    expect(result[0].amount).toBe(200);
  });

  it('splits series from instance and caps old template', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const split = makeExpense({ id: 'i2', date: '2026-03-05', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i3', date: '2026-03-06', recurrenceSeriesId: 't1' });
    const result = applyRecurrenceChangeOnEdit(
      [template, past, split, future],
      split,
      weeklyRule,
    );

    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-03-04');
    expect(result.find((e) => e.id === 'i1')).toBeDefined();
    expect(result.find((e) => e.id === 'i3')).toBeUndefined();
    expect(result.find((e) => e.id === 'i2')?.recurrenceRule).toEqual(weeklyRule);
    expect(result.find((e) => e.id === 'i2')?.recurrenceSeriesId).toBeUndefined();
  });

  it('stops recurrence from instance without affecting past instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const split = makeExpense({ id: 'i2', date: '2026-03-05', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i3', date: '2026-03-06', recurrenceSeriesId: 't1' });
    const result = applyRecurrenceChangeOnEdit([template, past, split, future], split, null);

    expect(result.find((e) => e.id === 'i1')).toBeDefined();
    expect(result.find((e) => e.id === 'i3')).toBeUndefined();
    expect(result.find((e) => e.id === 'i2')?.recurrenceSeriesId).toBeUndefined();
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-03-04');
  });
});
