import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { applyRecurrenceSeriesSettingsEdit } from './applyRecurrenceSeriesSettingsEdit';

const dailyRule = { type: 'daily' as const, interval: 1, occurrences: null };
const weeklyRule = { type: 'weekly' as const, interval: 1, customDays: [] as number[], occurrences: null };

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

describe('applyRecurrenceSeriesSettingsEdit', () => {
  it('updates scalar fields in place when rule is unchanged', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    const updated = { ...template, amount: 250 };

    const result = applyRecurrenceSeriesSettingsEdit(
      [template, instance],
      template,
      updated,
      dailyRule,
      '2026-07-10',
    );

    expect(result).toHaveLength(2);
    expect(result.find((e) => e.id === 't1')?.amount).toBe(250);
    expect(result.find((e) => e.id === 'i1')?.amount).toBe(100);
  });

  it('caps old template and creates new template on rule change', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    const updated = { ...template, amount: 200 };

    const result = applyRecurrenceSeriesSettingsEdit(
      [template, instance],
      template,
      updated,
      weeklyRule,
      '2026-07-10',
    );

    expect(result).toHaveLength(3);
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-07-09');
    expect(result.find((e) => e.id === 'i1')).toBeDefined();

    const newTemplate = result.find((e) => e.id !== 't1' && e.id !== 'i1');
    expect(newTemplate?.recurrenceRule).toEqual(weeklyRule);
    expect(newTemplate?.date).toBe('2026-07-10');
    expect(newTemplate?.amount).toBe(200);
  });

  it('caps old template and creates one-off when recurrence is removed', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });

    const result = applyRecurrenceSeriesSettingsEdit(
      [template, instance],
      template,
      template,
      null,
      '2026-07-10',
    );

    expect(result).toHaveLength(3);
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-07-09');
    const oneOff = result.find((e) => e.id !== 't1' && e.id !== 'i1');
    expect(oneOff?.recurrenceRule).toBeUndefined();
    expect(oneOff?.date).toBe('2026-07-10');
  });
});
