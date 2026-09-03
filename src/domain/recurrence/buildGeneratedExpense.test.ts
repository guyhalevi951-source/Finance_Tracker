import { describe, expect, it } from 'vitest';
import { buildGeneratedExpense } from './buildGeneratedExpense';
import { type Expense } from '../../types/expense';

function makeTemplate(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'template-1',
    description: { en: 'Rent', he: 'שכירות' },
    amount: 100,
    category: 'rent',
    date: '2026-01-01',
    paymentMethod: 'cash',
    recurrenceRule: { frequency: 'monthly', interval: 1 },
    ...overrides,
  };
}

describe('buildGeneratedExpense', () => {
  it('copies budgetId from template to generated instance', () => {
    const template = makeTemplate({ budgetId: 'sub-budget-1' });
    const generated = buildGeneratedExpense(template, '2026-02-01');

    expect(generated.budgetId).toBe('sub-budget-1');
    expect(generated.recurrenceSeriesId).toBe('template-1');
    expect(generated.date).toBe('2026-02-01');
  });

  it('omits budgetId when template is not linked to a sub-budget', () => {
    const template = makeTemplate();
    const generated = buildGeneratedExpense(template, '2026-02-01');

    expect(generated.budgetId).toBeUndefined();
  });
});
