import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import {
  applyRecurringBasicFieldUpdate,
  type RecurringBasicFields,
} from './applyRecurringBasicFieldUpdate';
import { computeDueDates } from './computeDueDates';
import { detachRecurringInstance } from './detachRecurringInstance';
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

const basicFields: RecurringBasicFields = {
  description: { en: 'Edited', he: 'ערוך' },
  amount: 200,
  category: 'food.groceries',
  paymentMethod: 'cash',
};

/** Mirrors useExpenseBatchMode applyPendingRecurringEdit (detach before instance-only merge). */
function applyInstanceOnlyDetach(
  expenses: Expense[],
  target: Expense,
  todayIso: string,
): Expense[] {
  let nextExpenses = detachRecurringInstance(expenses, target);
  const updatedTarget = nextExpenses.find((expense) => expense.id === target.id) ?? target;
  nextExpenses = applyRecurringBasicFieldUpdate(
    nextExpenses,
    updatedTarget,
    basicFields,
    'instanceOnly',
    todayIso,
  );
  return nextExpenses;
}

describe('detach recurring instance — edit modal integration', () => {
  it('preserves future materialized instances when detaching a middle instance', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instances = [2, 3, 4, 5, 6, 7].map((day) =>
      makeExpense({ id: `i${day}`, date: `2026-07-0${day}`, recurrenceSeriesId: 't1' }),
    );
    const expenses = [template, ...instances];
    const target = instances[2]; // July 4

    const result = applyInstanceOnlyDetach(expenses, target, '2026-07-10');

    expect(result).toHaveLength(7);
    for (const id of ['i5', 'i6', 'i7']) {
      const future = result.find((expense) => expense.id === id);
      expect(future).toBeDefined();
      expect(future?.recurrenceSeriesId).toBe('t1');
    }
    const detached = result.find((expense) => expense.id === 'i4');
    expect(detached?.recurrenceSeriesId).toBeUndefined();
    expect(detached?.amount).toBe(200);
  });

  it('keeps series active when detaching template anchor with no materialized instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const todayIso = '2026-07-01';

    const result = applyInstanceOnlyDetach([template], template, todayIso);

    expect(result).toHaveLength(2);
    expect(result.find((expense) => expense.id === 't1')?.recurrenceRule).toBeUndefined();
    expect(result.find((expense) => expense.id === 't1')?.amount).toBe(200);

    const activeTemplates = listActiveRecurrenceTemplates(result, todayIso);
    expect(activeTemplates).toHaveLength(1);
    expect(activeTemplates[0].date).toBe('2026-07-02');

    const dueDates = computeDueDates('2026-07-02', dailyRule, '2026-07-10');
    expect(dueDates.length).toBeGreaterThan(0);
  });

  it('keeps series active when detaching template anchor with existing instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const i2 = makeExpense({ id: 'i2', date: '2026-07-02', recurrenceSeriesId: 't1' });
    const i3 = makeExpense({ id: 'i3', date: '2026-07-03', recurrenceSeriesId: 't1' });
    const todayIso = '2026-07-10';

    const result = applyInstanceOnlyDetach([template, i2, i3], template, todayIso);

    expect(result).toHaveLength(3);
    expect(result.find((e) => e.id === 'i3')?.recurrenceSeriesId).toBe('i2');
    expect(isActiveRecurrenceTemplate(result.find((e) => e.id === 'i2')!, result, todayIso)).toBe(
      true,
    );
  });
});
