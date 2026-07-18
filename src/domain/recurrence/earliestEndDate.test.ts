import { describe, expect, it } from 'vitest';
import { type Expense } from '../../types/expense';
import { capTemplateEndDate, earliestEndDate } from './earliestEndDate';

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

describe('earliestEndDate', () => {
  it('returns candidate when no existing end date', () => {
    expect(earliestEndDate(undefined, '2026-07-09')).toBe('2026-07-09');
  });

  it('returns the earlier of existing and candidate', () => {
    expect(earliestEndDate('2026-07-05', '2026-07-09')).toBe('2026-07-05');
    expect(earliestEndDate('2026-07-09', '2026-07-05')).toBe('2026-07-05');
  });
});

describe('capTemplateEndDate', () => {
  it('does not extend an existing earlier end date', () => {
    const template = makeExpense({
      id: 't1',
      date: '2026-07-01',
      recurrenceEndDate: '2026-07-05',
    });

    const capped = capTemplateEndDate(template, '2026-07-09');
    expect(capped.recurrenceEndDate).toBe('2026-07-05');
  });

  it('sets end date when none exists', () => {
    const template = makeExpense({ id: 't1', date: '2026-07-01' });
    const capped = capTemplateEndDate(template, '2026-07-09');
    expect(capped.recurrenceEndDate).toBe('2026-07-09');
  });
});
