import { describe, expect, it } from 'vitest';
import { buildDefaultCategorySeed } from '../categories/seedDefaultCategories';
import {
  attachCategoryBreakdownPercents,
  groupPeriodCategoryBreakdown,
} from './groupPeriodCategoryBreakdown';
import { type Expense } from '../../types/expense';
import { type SubBudgetRecord } from '../../types/budget';

const { subs } = buildDefaultCategorySeed();

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: '1',
    description: { en: 'Test', he: 'Test' },
    amount: 10,
    category: 'food.groceries',
    date: '2026-07-10',
    paymentMethod: 'cash',
    ...overrides,
  };
}

const subBudgetA: SubBudgetRecord = {
  id: 'sub-a',
  name: { en: 'Trip', he: 'טיול' },
  totalAmount: 500,
  startDate: '2026-07-01',
  endDate: '2026-07-31',
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
};

describe('groupPeriodCategoryBreakdown', () => {
  it('groups sub-budget view expenses by parent category', () => {
    const slices = groupPeriodCategoryBreakdown({
      expenses: [
        makeExpense({ id: 'a', category: 'food.groceries', amount: 10 }),
        makeExpense({ id: 'b', category: 'food.restaurants', amount: 15 }),
        makeExpense({ id: 'c', category: 'housing.rent', amount: 100 }),
      ],
      subCategories: subs,
      subBudgets: [subBudgetA],
      isMaster: false,
    });

    expect(slices).toHaveLength(2);
    expect(slices[0]).toEqual({ id: 'housing', kind: 'category', total: 100 });
    expect(slices[1]).toEqual({ id: 'food', kind: 'category', total: 25 });
  });

  it('collapses master sub-budget expenses into one subBudget slice regardless of category', () => {
    const slices = groupPeriodCategoryBreakdown({
      expenses: [
        makeExpense({ id: 'a', category: 'food.groceries', amount: 40, budgetId: 'sub-a' }),
        makeExpense({ id: 'b', category: 'housing.rent', amount: 60, budgetId: 'sub-a' }),
      ],
      subCategories: subs,
      subBudgets: [subBudgetA],
      isMaster: true,
    });

    expect(slices).toEqual([{ id: 'sub-a', kind: 'subBudget', total: 100 }]);
  });

  it('keeps master direct expenses as category slices alongside sub-budget slices', () => {
    const slices = groupPeriodCategoryBreakdown({
      expenses: [
        makeExpense({ id: 'a', category: 'food.groceries', amount: 30 }),
        makeExpense({ id: 'b', category: 'food.groceries', amount: 70, budgetId: 'sub-a' }),
      ],
      subCategories: subs,
      subBudgets: [subBudgetA],
      isMaster: true,
    });

    expect(slices).toHaveLength(2);
    expect(slices[0]).toEqual({ id: 'sub-a', kind: 'subBudget', total: 70 });
    expect(slices[1]).toEqual({ id: 'food', kind: 'category', total: 30 });
  });

  it('clusters sub-budget slices before category slices even when category total is larger', () => {
    const slices = groupPeriodCategoryBreakdown({
      expenses: [
        makeExpense({ id: 'a', category: 'housing.rent', amount: 500 }),
        makeExpense({ id: 'b', category: 'food.groceries', amount: 10, budgetId: 'sub-a' }),
      ],
      subCategories: subs,
      subBudgets: [subBudgetA],
      isMaster: true,
    });

    expect(slices).toHaveLength(2);
    expect(slices[0]?.kind).toBe('subBudget');
    expect(slices[1]?.kind).toBe('category');
    expect(slices[0]?.total).toBeLessThan(slices[1]?.total ?? 0);
  });

  it('treats detached budgetId as direct category expenses on master view', () => {
    const slices = groupPeriodCategoryBreakdown({
      expenses: [makeExpense({ id: 'a', category: 'food.groceries', amount: 20, budgetId: 'gone' })],
      subCategories: subs,
      subBudgets: [subBudgetA],
      isMaster: true,
    });

    expect(slices).toEqual([{ id: 'food', kind: 'category', total: 20 }]);
  });
});

describe('attachCategoryBreakdownPercents', () => {
  it('returns empty list when total is zero', () => {
    expect(attachCategoryBreakdownPercents([])).toEqual([]);
  });

  it('computes percentages from slice totals', () => {
    const withPercents = attachCategoryBreakdownPercents([
      { id: 'food', kind: 'category', total: 75 },
      { id: 'housing', kind: 'category', total: 25 },
    ]);

    expect(withPercents[0]?.percent).toBeCloseTo(75);
    expect(withPercents[1]?.percent).toBeCloseTo(25);
  });
});
