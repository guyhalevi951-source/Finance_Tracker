import { describe, expect, it } from 'vitest';
import { finalizeRecurrenceSchedule } from './finalizeRecurrenceSchedule';
import { type Expense } from '../../types/expense';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 't1',
    description: { en: 'Rent', he: 'שכירות' },
    amount: 100,
    category: 'rent',
    date: '2026-01-01',
    paymentMethod: 'cash',
    recurrenceRule: { type: 'monthly', interval: 1, occurrences: 3 },
    ...overrides,
  };
}

describe('finalizeRecurrenceSchedule', () => {
  it('stamps recurrenceEndDate from limited occurrence count', () => {
    const result = finalizeRecurrenceSchedule(makeExpense());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expense.recurrenceEndDate).toBe('2026-03-01');
    expect(result.expense.recurrenceRule?.occurrences).toBe(3);
  });

  it('filters dates past sub-budget end and adjusts occurrences', () => {
    const result = finalizeRecurrenceSchedule(makeExpense(), { capEndDateIso: '2026-02-01' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expense.recurrenceEndDate).toBe('2026-02-01');
    expect(result.expense.recurrenceRule?.occurrences).toBe(2);
  });

  it('rejects start date after sub-budget end', () => {
    const result = finalizeRecurrenceSchedule(
      makeExpense({ date: '2026-03-01' }),
      { capEndDateIso: '2026-02-01' },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('START_AFTER_BUDGET_END');
  });

  it('leaves unlimited master series without recurrenceEndDate', () => {
    const result = finalizeRecurrenceSchedule(
      makeExpense({ recurrenceRule: { type: 'monthly', interval: 1, occurrences: null } }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expense.recurrenceEndDate).toBeUndefined();
  });
});
