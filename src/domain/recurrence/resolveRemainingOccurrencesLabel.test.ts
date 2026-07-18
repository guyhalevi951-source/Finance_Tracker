import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
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

describe('resolveRemainingOccurrencesLabelDescriptor', () => {
  it('returns unlimited key when rule has no occurrence cap', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01', recurrenceRule: dailyRule });
    const descriptor = resolveRemainingOccurrencesLabelDescriptor(template, [template]);
    expect(descriptor.key).toBe('profile.settings.recurring.unlimitedOccurrences');
  });

  it('returns remaining count when rule has a cap', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 5 },
    });
    const instance = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    const descriptor = resolveRemainingOccurrencesLabelDescriptor(template, [template, instance]);
    expect(descriptor.key).toBe('profile.settings.recurring.remainingOccurrences');
    expect(descriptor.params?.count).toBe(3);
  });

  it('counts excluded dates as consumed so remaining does not rise after a delete', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: 5 },
      recurrenceExcludedDates: ['2026-07-03'],
    });
    const a = makeExpense({ id: 'i1', date: '2026-07-02', recurrenceSeriesId: 't1' });
    // 2 materialized + 1 excluded = 3 consumed → 2 remaining
    const descriptor = resolveRemainingOccurrencesLabelDescriptor(template, [template, a]);
    expect(descriptor.params?.count).toBe(2);
  });
});
