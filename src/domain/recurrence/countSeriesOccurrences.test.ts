import { describe, it, expect } from 'vitest';
import { type Expense } from '../../types/expense';
import {
  countConsumedSeriesOccurrences,
  countExcludedSlotsNotMaterialized,
  countSeriesOccurrences,
} from './countSeriesOccurrences';
import { deleteTimelineExpenseSelections } from './deleteTimelineExpenseSelections';
import { resolveRemainingOccurrencesLabelDescriptor } from './resolveRemainingOccurrencesLabel';
import { filterTimelineVisibleExpenses } from './filterTimelineVisibleExpenses';

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'id'>): Expense {
  return {
    id: overrides.id,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 10,
    category: 'food.groceries',
    date: '2026-03-01',
    paymentMethod: 'cash',
    ...overrides,
  };
}

describe('countSeriesOccurrences', () => {
  it('counts template and generated instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-03-01' });
    const instance = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });

    expect(countSeriesOccurrences([template, instance], 't1')).toBe(2);
  });

  it('does not count unrelated expenses', () => {
    const template = makeExpense({ id: 't1' });
    const other = makeExpense({ id: 'other' });

    expect(countSeriesOccurrences([template, other], 't1')).toBe(1);
  });
});

describe('countConsumedSeriesOccurrences', () => {
  it('adds excluded dates to the materialized count', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceExcludedDates: ['2026-03-02'],
    });
    const instance = makeExpense({ id: 'i1', date: '2026-03-03', recurrenceSeriesId: 't1' });

    expect(countConsumedSeriesOccurrences([template, instance], template)).toBe(3);
  });

  it('does not double-count anchor date when template row still exists', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 5 },
      recurrenceExcludedDates: ['2026-03-01', '2026-03-02', '2026-03-03'],
    });

    expect(countExcludedSlotsNotMaterialized([template], template)).toBe(2);
    expect(countConsumedSeriesOccurrences([template], template)).toBe(3);
  });

  it('keeps remaining occurrences at 2 after deleting all timeline rows in a 5-occurrence series', () => {
    const dailyRule = { type: 'daily' as const, interval: 1, occurrences: 5 };
    const template = makeExpense({
      id: 't1',
      date: '2026-03-01',
      recurrenceRule: dailyRule,
    });
    const instance1 = makeExpense({ id: 'i1', date: '2026-03-02', recurrenceSeriesId: 't1' });
    const instance2 = makeExpense({ id: 'i2', date: '2026-03-03', recurrenceSeriesId: 't1' });

    const afterDelete = deleteTimelineExpenseSelections(
      [template, instance1, instance2],
      new Set(['t1', 'i1', 'i2']),
    );
    const updatedTemplate = afterDelete.find((expense) => expense.id === 't1')!;

    const descriptor = resolveRemainingOccurrencesLabelDescriptor(updatedTemplate, afterDelete);
    expect(descriptor.params?.count).toBe(2);
    expect(filterTimelineVisibleExpenses(afterDelete, '2026-03-05')).toHaveLength(0);
  });
});
