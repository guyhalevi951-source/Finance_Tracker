import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
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

describe('isActiveRecurrenceTemplate', () => {
  it('returns false when template has no recurrence rule', () => {
    const expense = makeExpense({ id: 'e1', date: '2026-07-01' });
    expect(isActiveRecurrenceTemplate(expense, [expense], '2026-07-10')).toBe(false);
  });

  it('returns false when recurrence end date is in the past', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-07-05',
    });
    expect(isActiveRecurrenceTemplate(template, [template], '2026-07-10')).toBe(false);
  });

  it('returns false when recurrence end date is today (today is locked, not managed)', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-07-10',
    });
    expect(isActiveRecurrenceTemplate(template, [template], '2026-07-10')).toBe(false);
  });

  it('returns false when occurrence limit is reached', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 2 },
    });
    const instance = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    expect(isActiveRecurrenceTemplate(template, [template, instance], '2026-07-03')).toBe(false);
  });

  it('returns true for unlimited daily template with future due dates', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: dailyRule,
    });
    expect(isActiveRecurrenceTemplate(template, [template], '2026-07-10')).toBe(true);
  });

  it('returns false when next due date is excluded and occurrence limit is reached', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 2 },
      recurrenceExcludedDates: ['2026-07-11'],
    });
    const instance = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    expect(isActiveRecurrenceTemplate(template, [template, instance], '2026-07-10')).toBe(false);
  });
});

describe('listActiveRecurrenceTemplates', () => {
  it('returns only active templates', () => {
    const active = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: dailyRule,
    });
    const ended = makeExpense({
      id: 't2',
      date: '2026-06-01',
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-06-30',
    });
    const instance = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });

    const result = listActiveRecurrenceTemplates([active, ended, instance], '2026-07-10');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
  });

  it('after settings-style split, only the tomorrow successor stays active', () => {
    const capped = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 99,
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-07-10',
    });
    const todayInstance = makeExpense({
      id: 'iToday',
      date: '2026-07-10',
      amount: 99,
      recurrenceSeriesId: 't1',
    });
    const successor = makeExpense({
      id: 't2',
      date: '2026-07-11',
      amount: 100,
      recurrenceRule: dailyRule,
    });

    const result = listActiveRecurrenceTemplates(
      [capped, todayInstance, successor],
      '2026-07-10',
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t2');
    expect(result[0].amount).toBe(100);
  });
});
