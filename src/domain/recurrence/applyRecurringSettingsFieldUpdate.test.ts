import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import {
  applyRecurringSettingsFieldUpdate,
  resolveRecurrenceGenerationFields,
  resolveSettingsSeriesDisplayFields,
} from './applyRecurringSettingsFieldUpdate';

const dailyRule = { type: 'daily' as const, interval: 1, occurrences: null };

function makeExpense(overrides: Partial<Expense> & Pick<Expense, 'id' | 'date'>): Expense {
  return {
    id: overrides.id,
    date: overrides.date,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 99,
    category: 'food.groceries',
    paymentMethod: 'cash',
    ...overrides,
  };
}

describe('applyRecurringSettingsFieldUpdate', () => {
  it('schedules pending fields from tomorrow without creating a tomorrow-dated row', () => {
    const todayIso = '2026-07-18';
    const template = makeExpense({ id: 't1', date: '2026-07-15', recurrenceRule: dailyRule });
    const today = makeExpense({ id: 'iToday', date: todayIso, amount: 99, recurrenceSeriesId: 't1' });
    const past = makeExpense({ id: 'iPast', date: '2026-07-17', amount: 99, recurrenceSeriesId: 't1' });
    const updatedFields = {
      description: { en: 'Updated', he: 'עודכן' },
      amount: 100,
      category: 'food.restaurants' as const,
      paymentMethod: 'credit' as const,
    };

    const result = applyRecurringSettingsFieldUpdate(
      [template, past, today],
      template,
      updatedFields,
      todayIso,
    );

    expect(result).toHaveLength(3);
    expect(result.find((e) => e.date === '2026-07-19')).toBeUndefined();
    expect(result.find((e) => e.id === 'iToday')?.amount).toBe(99);
    expect(result.find((e) => e.id === 'iPast')?.amount).toBe(99);

    const updatedTemplate = result.find((e) => e.id === 't1')!;
    expect(updatedTemplate.amount).toBe(99);
    expect(updatedTemplate.recurrencePendingBasicFields).toEqual({
      effectiveFromIso: '2026-07-19',
      ...updatedFields,
    });
  });

  it('updates already-materialized rows on/after effective from date', () => {
    const todayIso = '2026-07-18';
    const template = makeExpense({ id: 't1', date: '2026-07-15', recurrenceRule: dailyRule });
    const premature = makeExpense({
      id: 'iFuture',
      date: '2026-07-19',
      amount: 99,
      recurrenceSeriesId: 't1',
    });
    const updatedFields = {
      description: template.description,
      amount: 100,
      category: template.category,
      paymentMethod: template.paymentMethod,
    };

    const result = applyRecurringSettingsFieldUpdate(
      [template, premature],
      template,
      updatedFields,
      todayIso,
    );

    expect(result.find((e) => e.id === 'iFuture')?.amount).toBe(100);
  });
});

describe('resolveRecurrenceGenerationFields', () => {
  it('uses pending fields on/after effectiveFromIso and template fields before', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-15',
      amount: 99,
      recurrenceRule: dailyRule,
      recurrencePendingBasicFields: {
        effectiveFromIso: '2026-07-19',
        description: { en: 'New', he: 'חדש' },
        amount: 100,
        category: 'food.restaurants',
        paymentMethod: 'credit',
      },
    });

    expect(resolveRecurrenceGenerationFields(template, '2026-07-18').amount).toBe(99);
    expect(resolveRecurrenceGenerationFields(template, '2026-07-19').amount).toBe(100);
  });
});

describe('resolveSettingsSeriesDisplayFields', () => {
  it('prefers pending fields for Settings display', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-15',
      amount: 99,
      recurrencePendingBasicFields: {
        effectiveFromIso: '2026-07-19',
        description: { en: 'New', he: 'חדש' },
        amount: 100,
        category: 'food.restaurants',
        paymentMethod: 'credit',
      },
    });

    expect(resolveSettingsSeriesDisplayFields(template).amount).toBe(100);
  });
});
