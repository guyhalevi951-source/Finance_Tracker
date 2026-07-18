import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { computeDueDates } from './computeDueDates';
import { detachRecurringInstance } from './detachRecurringInstance';
import { isRecurringExpense } from './isRecurringExpense';
import { isRecurrenceDateExcluded } from './isRecurrenceDateExcluded';
import { requiresRecurringDeletePrompt } from './requiresRecurringDeletePrompt';

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

describe('detachRecurringInstance', () => {
  it('detaches materialized instance and excludes date on template', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-07-05', recurrenceSeriesId: 't1' });

    const result = detachRecurringInstance([template, instance], instance);
    const detached = result.find((e) => e.id === 'i1');
    const updatedTemplate = result.find((e) => e.id === 't1');

    expect(detached?.recurrenceSeriesId).toBeUndefined();
    expect(isRecurringExpense(detached!)).toBe(false);
    expect(updatedTemplate?.recurrenceExcludedDates).toEqual(['2026-07-05']);
    expect(requiresRecurringDeletePrompt(result, detached!, '2026-07-05')).toBe(false);
  });

  it('excluded date prevents sync regeneration', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-07-05', recurrenceSeriesId: 't1' });
    const todayIso = '2026-07-10';

    const result = detachRecurringInstance([template, instance], instance);
    const updatedTemplate = result.find((e) => e.id === 't1')!;

    const dueDates = computeDueDates(updatedTemplate.date, dailyRule, todayIso);
    const regeneratableDates = dueDates.filter(
      (date) => !isRecurrenceDateExcluded(updatedTemplate, date),
    );

    expect(regeneratableDates).not.toContain('2026-07-05');
  });

  it('detaches template row by promoting successor and converting template to one-off', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance1 = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    const instance2 = makeExpense({ id: 'i2', date: '2026-07-03', recurrenceSeriesId: 't1' });

    const result = detachRecurringInstance([template, instance1, instance2], template);

    const detachedTemplate = result.find((e) => e.id === 't1');
    const promoted = result.find((e) => e.id === 'i1');

    expect(detachedTemplate?.recurrenceRule).toBeUndefined();
    expect(isRecurringExpense(detachedTemplate!)).toBe(false);
    expect(promoted?.recurrenceRule).toEqual(dailyRule);
    expect(promoted?.recurrenceExcludedDates).toEqual(['2026-07-01']);
    expect(result.find((e) => e.id === 'i2')?.recurrenceSeriesId).toBe('i1');
  });
});
