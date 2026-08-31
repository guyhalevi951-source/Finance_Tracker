import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { computeDueDates } from './computeDueDates';
import {
  deleteTimelineExpenseInstance,
  deleteTimelineExpenseSelections,
} from './deleteTimelineExpenseSelections';
import { filterTimelineVisibleExpenses } from './filterTimelineVisibleExpenses';
import { isRecurrenceDateExcluded } from './isRecurrenceDateExcluded';
import { isActiveRecurrenceTemplate } from './isActiveRecurrenceTemplate';
import { listActiveRecurrenceTemplates } from './listActiveRecurrenceTemplates';

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

describe('deleteTimelineExpenseInstance', () => {
  it('removes one-time expense only', () => {
    const oneTime = makeExpense({ id: 'e1', date: '2026-03-01' });
    const other = makeExpense({ id: 'e2', date: '2026-03-02' });

    const result = deleteTimelineExpenseInstance([oneTime, other], oneTime);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('e2');
  });

  it('excludes date on template and removes materialized instance', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const other = makeExpense({ id: 'i2', date: '2026-03-03', recurrenceSeriesId: 't1' });

    const result = deleteTimelineExpenseInstance([template, instance, other], instance);

    expect(result.find((expense) => expense.id === 'i1')).toBeUndefined();
    expect(result.find((expense) => expense.id === 'i2')).toBeDefined();
    expect(result.find((expense) => expense.id === 't1')?.recurrenceExcludedDates).toEqual([
      '2026-03-02',
    ]);
  });

  it('excluded date prevents sync regeneration', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const todayIso = '2026-03-10';

    const result = deleteTimelineExpenseInstance([template, instance], instance);
    const updatedTemplate = result.find((expense) => expense.id === 't1')!;

    const dueDates = computeDueDates(updatedTemplate.date, dailyRule, todayIso);
    const regeneratableDates = dueDates.filter(
      (date) => !isRecurrenceDateExcluded(updatedTemplate, date),
    );

    expect(regeneratableDates).not.toContain('2026-03-02');
  });

  it('excludes anchor date and keeps template with recurrenceRule', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const instance1 = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const instance2 = makeExpense({ id: 'i2', date: '2026-03-03', recurrenceSeriesId: 't1' });

    const result = deleteTimelineExpenseInstance([template, instance1, instance2], template);

    const updatedTemplate = result.find((expense) => expense.id === 't1');
    expect(updatedTemplate).toBeDefined();
    expect(updatedTemplate?.recurrenceRule).toEqual(dailyRule);
    expect(updatedTemplate?.recurrenceExcludedDates).toEqual(['2026-03-01']);
    expect(result.find((expense) => expense.id === 'i1')?.recurrenceSeriesId).toBe('t1');
    expect(result.find((expense) => expense.id === 'i2')?.recurrenceSeriesId).toBe('t1');
  });
});

describe('deleteTimelineExpenseSelections', () => {
  it('deletes multiple selected instances in the same series', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const instance1 = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const instance2 = makeExpense({ id: 'i2', date: '2026-03-03', recurrenceSeriesId: 't1' });
    const instance3 = makeExpense({ id: 'i3', date: '2026-03-04', recurrenceSeriesId: 't1' });

    const result = deleteTimelineExpenseSelections(
      [template, instance1, instance2, instance3],
      new Set(['i2', 'i3']),
    );

    expect(result.find((expense) => expense.id === 'i2')).toBeUndefined();
    expect(result.find((expense) => expense.id === 'i3')).toBeUndefined();
    expect(result.find((expense) => expense.id === 'i1')).toBeDefined();
    const excludedDates = result.find((expense) => expense.id === 't1')?.recurrenceExcludedDates;
    expect(excludedDates).toHaveLength(2);
    expect(excludedDates).toEqual(expect.arrayContaining(['2026-03-03', '2026-03-04']));
  });

  it('keeps series template active after deleting all timeline rows', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01', recurrenceRule: dailyRule });
    const instance1 = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const instance2 = makeExpense({ id: 'i2', date: '2026-03-03', recurrenceSeriesId: 't1' });
    const todayIso = '2026-03-05';

    const result = deleteTimelineExpenseSelections(
      [template, instance1, instance2],
      new Set(['t1', 'i1', 'i2']),
    );

    const updatedTemplate = result.find((expense) => expense.id === 't1');
    expect(updatedTemplate).toBeDefined();
    expect(updatedTemplate?.recurrenceRule).toEqual(dailyRule);
    expect(result.find((expense) => expense.id === 'i1')).toBeUndefined();
    expect(result.find((expense) => expense.id === 'i2')).toBeUndefined();

    expect(isActiveRecurrenceTemplate(updatedTemplate!, result, todayIso)).toBe(true);
    expect(listActiveRecurrenceTemplates(result, todayIso)).toHaveLength(1);

    const dueDates = computeDueDates(updatedTemplate!.date, dailyRule, '2026-03-10');
    const futureDates = dueDates.filter(
      (date) =>
        date > todayIso &&
        !isRecurrenceDateExcluded(updatedTemplate!, date),
    );
    expect(futureDates.length).toBeGreaterThan(0);

    expect(filterTimelineVisibleExpenses(result)).toHaveLength(0);
  });
});
