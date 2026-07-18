import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { applyRecurringBasicFieldUpdate } from './applyRecurringBasicFieldUpdate';
import { listActiveRecurrenceTemplates } from './listActiveRecurrenceTemplates';
import { resolveRemainingOccurrencesLabelDescriptor } from './resolveRemainingOccurrencesLabel';

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

describe('applyRecurringBasicFieldUpdate', () => {
  it('instanceOnly updates only the target row', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const instance = makeExpense({ id: 'i1', date: '2026-07-05', recurrenceSeriesId: 't1' });
    const updatedFields = {
      description: { en: 'Updated', he: 'עודכן' },
      amount: 250,
      category: 'food.groceries' as const,
      paymentMethod: 'credit' as const,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, instance],
      instance,
      updatedFields,
      'instanceOnly',
      '2026-07-10',
    );

    expect(result.find((e) => e.id === 'i1')?.amount).toBe(250);
    expect(result.find((e) => e.id === 't1')?.amount).toBe(100);
  });

  it('thisAndFuture preserves historical template and instances before split date', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    const split = makeExpense({ id: 'i2', date: '2026-07-05', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i3', date: '2026-07-06', recurrenceSeriesId: 't1' });
    const updatedFields = {
      description: { en: 'Updated', he: 'עודכן' },
      amount: 250,
      category: 'food.groceries' as const,
      paymentMethod: 'credit' as const,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, past, split, future],
      split,
      updatedFields,
      'thisAndFuture',
      '2026-07-05',
    );

    expect(result.find((e) => e.id === 'i1')?.amount).toBe(100);
    expect(result.find((e) => e.id === 't1')?.amount).toBe(100);
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-07-04');

    const successorTemplate = result.find(
      (e) => e.recurrenceRule !== undefined && e.id !== 't1',
    );
    expect(successorTemplate?.amount).toBe(250);
    expect(successorTemplate?.date).toBe('2026-07-05');

    expect(result.find((e) => e.id === 'i3')?.amount).toBe(250);
    expect(result.find((e) => e.id === 'i3')?.recurrenceSeriesId).toBe(successorTemplate?.id);
  });

  it('thisAndFuture from past instance uses today as split date, not target date', () => {
    const todayIso = '2026-07-10';
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const pastTarget = makeExpense({ id: 'i1', date: '2026-07-05', recurrenceSeriesId: 't1' });
    const todayInstance = makeExpense({ id: 'i2', date: '2026-07-10', recurrenceSeriesId: 't1' });
    const futureInstance = makeExpense({ id: 'i3', date: '2026-07-11', recurrenceSeriesId: 't1' });
    const updatedFields = {
      description: { en: 'Updated', he: 'עודכן' },
      amount: 250,
      category: 'food.groceries' as const,
      paymentMethod: 'credit' as const,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, pastTarget, todayInstance, futureInstance],
      pastTarget,
      updatedFields,
      'thisAndFuture',
      todayIso,
    );

    expect(result.find((e) => e.id === 'i1')?.amount).toBe(100);
    expect(result.find((e) => e.id === 't1')?.amount).toBe(100);
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-07-09');

    const successorTemplate = result.find(
      (e) => e.recurrenceRule !== undefined && e.id !== 't1',
    );
    expect(successorTemplate?.amount).toBe(250);
    expect(successorTemplate?.date).toBe(todayIso);

    expect(result.find((e) => e.id === 'i2')).toBeUndefined();
    expect(result.find((e) => e.id === 'i3')?.amount).toBe(250);
    expect(result.find((e) => e.id === 'i3')?.recurrenceSeriesId).toBe(successorTemplate?.id);
  });

  it('thisAndFuture amount split preserves remaining occurrence budget on successor', () => {
    const limitedRule = { type: 'daily' as const, interval: 1, occurrences: 4 };
    const template = makeExpense({
      id: 't1',
      date: '2026-07-16',
      amount: 100,
      recurrenceRule: limitedRule,
    });
    const todayInstance = makeExpense({
      id: 'i1',
      date: '2026-07-17',
      amount: 100,
      recurrenceSeriesId: 't1',
    });
    const updatedFields = {
      description: template.description,
      amount: 200,
      category: template.category,
      paymentMethod: template.paymentMethod,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, todayInstance],
      todayInstance,
      updatedFields,
      'thisAndFuture',
      '2026-07-17',
    );

    const successor = result.find((e) => e.recurrenceRule && e.id !== 't1');
    // prior series count 2, remaining 2 → successor count 1 → new limit 3
    expect(successor?.recurrenceRule?.occurrences).toBe(3);
  });

  it('thisAndFuture amount split preserves remaining when successor carries excluded dates', () => {
    const limitedRule = { type: 'daily' as const, interval: 1, occurrences: 8 };
    const template = makeExpense({
      id: 't1',
      date: '2026-07-13',
      amount: 100,
      recurrenceRule: limitedRule,
      recurrenceExcludedDates: ['2026-07-15'],
    });
    const i1 = makeExpense({ id: 'i1', date: '2026-07-14', amount: 100, recurrenceSeriesId: 't1' });
    const i2 = makeExpense({ id: 'i2', date: '2026-07-16', amount: 100, recurrenceSeriesId: 't1' });
    const i3 = makeExpense({ id: 'i3', date: '2026-07-17', amount: 100, recurrenceSeriesId: 't1' });
    // consumed = 4 mat + 1 excl = 5, remaining = 3
    const updatedFields = {
      description: template.description,
      amount: 200,
      category: template.category,
      paymentMethod: template.paymentMethod,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, i1, i2, i3],
      i1,
      updatedFields,
      'thisAndFuture',
      '2026-07-14',
    );

    const successor = result.find((e) => e.recurrenceRule && e.id !== 't1');
    // successor mat 3 + excl 1 = 4 base; remaining 3 → limit 7; display remaining 3
    expect(successor?.recurrenceExcludedDates).toEqual(['2026-07-15']);
    expect(successor?.recurrenceRule?.occurrences).toBe(7);
    expect(
      resolveRemainingOccurrencesLabelDescriptor(successor!, result).params?.count,
    ).toBe(3);
  });

  it('repeated thisAndFuture splits do not inflate remaining when absorbing continuations', () => {
    const limitedRule = { type: 'daily' as const, interval: 1, occurrences: 9 };
    const template = makeExpense({
      id: 't1',
      date: '2026-07-11',
      amount: 100,
      recurrenceRule: limitedRule,
      recurrenceEndDate: '2026-07-16',
    });
    const past = makeExpense({ id: 'i0', date: '2026-07-12', amount: 100, recurrenceSeriesId: 't1' });
    const continuation = makeExpense({
      id: 't2',
      date: '2026-07-17',
      amount: 100,
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 3 },
    });
    const contInstance = makeExpense({
      id: 'i1',
      date: '2026-07-18',
      amount: 100,
      recurrenceSeriesId: 't2',
    });
    // Family consumed = 4, remaining vs original limit 9 = 5 — but after a real first split
    // remaining was 1 with 8 consumed. Model that: 6 on old + 2 on continuation = 8.
    const oldMembers = [
      template,
      past,
      makeExpense({ id: 'i2', date: '2026-07-13', amount: 100, recurrenceSeriesId: 't1' }),
      makeExpense({ id: 'i3', date: '2026-07-14', amount: 100, recurrenceSeriesId: 't1' }),
      makeExpense({ id: 'i4', date: '2026-07-15', amount: 100, recurrenceSeriesId: 't1' }),
      makeExpense({ id: 'i5', date: '2026-07-16', amount: 100, recurrenceSeriesId: 't1' }),
      continuation,
      contInstance,
    ];
    const updatedFields = {
      description: template.description,
      amount: 200,
      category: template.category,
      paymentMethod: template.paymentMethod,
    };

    const result = applyRecurringBasicFieldUpdate(
      oldMembers,
      oldMembers.find((e) => e.id === 'i2')!,
      updatedFields,
      'thisAndFuture',
      '2026-07-13',
    );

    const successor = result.find((e) => e.recurrenceRule && e.id !== 't1');
    expect(
      resolveRemainingOccurrencesLabelDescriptor(successor!, result).params?.count,
    ).toBe(1);
  });

  it('thisAndFuture from timeline updates active template amount without touching history (55 to 77)', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      amount: 55,
      recurrenceRule: dailyRule,
    });
    const past = makeExpense({ id: 'i0', date: '2026-07-02', amount: 55, recurrenceSeriesId: 't1' });
    const instance = makeExpense({
      id: 'i1',
      date: '2026-07-10',
      amount: 55,
      recurrenceSeriesId: 't1',
    });
    const updatedFields = {
      description: template.description,
      amount: 77,
      category: template.category,
      paymentMethod: template.paymentMethod,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, past, instance],
      instance,
      updatedFields,
      'thisAndFuture',
      '2026-07-10',
    );

    expect(result.find((e) => e.id === 't1')?.amount).toBe(55);
    expect(result.find((e) => e.id === 'i0')?.amount).toBe(55);

    const activeTemplates = listActiveRecurrenceTemplates(result, '2026-07-10');
    expect(activeTemplates).toHaveLength(1);
    expect(activeTemplates[0].amount).toBe(77);
    expect(activeTemplates[0].id).not.toBe('t1');
  });

  it('settings-style save splits after today so today instance stays unchanged', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', amount: 5, recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-07-02', amount: 5, recurrenceSeriesId: 't1' });
    const today = makeExpense({ id: 'iToday', date: '2026-07-10', amount: 5, recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i2', date: '2026-07-12', amount: 5, recurrenceSeriesId: 't1' });
    const updatedFields = {
      description: { en: 'Updated', he: 'עודכן' },
      amount: 250,
      category: 'food.groceries' as const,
      paymentMethod: 'credit' as const,
    };

    // Profile Settings uses dayAfter(today) as the effective-from split.
    const result = applyRecurringBasicFieldUpdate(
      [template, past, today, future],
      template,
      updatedFields,
      'thisAndFuture',
      '2026-07-11',
    );

    expect(result.find((e) => e.id === 'i1')?.amount).toBe(5);
    expect(result.find((e) => e.id === 't1')?.amount).toBe(5);
    expect(result.find((e) => e.id === 'iToday')?.amount).toBe(5);
    expect(result.find((e) => e.id === 'i2')?.amount).toBe(250);
  });

  it('settings-style save splits at today and preserves past instances', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const past = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    const future = makeExpense({ id: 'i2', date: '2026-07-12', recurrenceSeriesId: 't1' });
    const updatedFields = {
      description: { en: 'Updated', he: 'עודכן' },
      amount: 250,
      category: 'food.groceries' as const,
      paymentMethod: 'credit' as const,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, past, future],
      template,
      updatedFields,
      'thisAndFuture',
      '2026-07-10',
    );

    expect(result.find((e) => e.id === 'i1')?.amount).toBe(100);
    expect(result.find((e) => e.id === 't1')?.amount).toBe(100);
    expect(result.find((e) => e.id === 'i2')?.amount).toBe(250);
  });

  it('thisAndFuture does not inherit prior series endDate onto successor', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-15',
      amount: 44,
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-07-16',
    });
    const mid = makeExpense({
      id: 'i1',
      date: '2026-07-16',
      amount: 44,
      recurrenceSeriesId: 't1',
    });
    const continuation = makeExpense({
      id: 't2',
      date: '2026-07-17',
      amount: 30,
      recurrenceRule: dailyRule,
    });
    const updatedFields = {
      description: template.description,
      amount: 20,
      category: template.category,
      paymentMethod: template.paymentMethod,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, mid, continuation],
      mid,
      updatedFields,
      'thisAndFuture',
      '2026-07-16',
    );

    expect(result.find((e) => e.id === 't1')?.amount).toBe(44);
    expect(result.find((e) => e.id === 't1')?.recurrenceEndDate).toBe('2026-07-15');

    const successor = result.find((e) => e.recurrenceRule && e.id !== 't1');
    expect(successor?.amount).toBe(20);
    expect(successor?.date).toBe('2026-07-16');
    expect(successor?.recurrenceEndDate).toBeUndefined();

    const absorbed = result.find((e) => e.id === 't2');
    expect(absorbed?.amount).toBe(20);
    expect(absorbed?.recurrenceSeriesId).toBe(successor?.id);
    expect(absorbed?.recurrenceRule).toBeUndefined();
    expect(absorbed?.date).toBe('2026-07-17');
  });

  it('thisAndFuture on capped historical template also updates continuation successors', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-14',
      amount: 66,
      recurrenceRule: dailyRule,
      recurrenceEndDate: '2026-07-14',
    });
    const continuation = makeExpense({
      id: 't2',
      date: '2026-07-15',
      amount: 50,
      recurrenceRule: dailyRule,
    });
    const future = makeExpense({
      id: 'i1',
      date: '2026-07-17',
      amount: 50,
      recurrenceSeriesId: 't2',
    });
    const detached = makeExpense({
      id: 'd1',
      date: '2026-07-16',
      amount: 60,
    });
    const updatedFields = {
      description: template.description,
      amount: 20,
      category: template.category,
      paymentMethod: template.paymentMethod,
    };

    const result = applyRecurringBasicFieldUpdate(
      [template, continuation, future, detached],
      template,
      updatedFields,
      'thisAndFuture',
      '2026-07-14',
    );

    expect(result.find((e) => e.id === 't1')?.amount).toBe(20);
    expect(result.find((e) => e.id === 't2')?.amount).toBe(20);
    expect(result.find((e) => e.id === 'i1')?.amount).toBe(20);
    expect(result.find((e) => e.id === 'd1')?.amount).toBe(60);
  });
});
