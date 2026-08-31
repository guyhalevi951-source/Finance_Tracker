import { describe, expect, it } from 'vitest';
import { restoreMigratedExpensesOnCategoryReset } from './restoreExpensesOnCategoryReset';
import { buildDefaultCategorySeed } from './seedDefaultCategories';
import { SUB_CATEGORY_DELETE_FALLBACK_ID } from './deleteSubCategory';
import { type Expense } from '../../types/expense';

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    description: { en: 'Test', he: 'Test' },
    amount: 10,
    category: SUB_CATEGORY_DELETE_FALLBACK_ID,
    date: '2026-08-31',
    paymentMethod: 'cash',
    ...overrides,
  };
}

describe('restoreMigratedExpensesOnCategoryReset', () => {
  it('restores miscellaneous expenses whose original builtin sub exists and clears origin', () => {
    const { subs } = buildDefaultCategorySeed();
    const expenses: Expense[] = [
      makeExpense({
        id: 'restore',
        originalCategoryId: 'food',
        originalSubCategoryId: 'food.groceries',
      }),
      makeExpense({ id: 'manual-misc' }),
    ];

    const result = restoreMigratedExpensesOnCategoryReset(
      expenses,
      subs,
      SUB_CATEGORY_DELETE_FALLBACK_ID,
    );

    expect(result.find((e) => e.id === 'restore')?.category).toBe('food.groceries');
    expect(result.find((e) => e.id === 'restore')?.originalSubCategoryId).toBeUndefined();
    expect(result.find((e) => e.id === 'restore')?.originalCategoryId).toBeUndefined();
    expect(result.find((e) => e.id === 'manual-misc')?.category).toBe(
      SUB_CATEGORY_DELETE_FALLBACK_ID,
    );
  });

  it('leaves expenses whose original sub is not in the restored catalog', () => {
    const { subs } = buildDefaultCategorySeed();
    const expenses: Expense[] = [
      makeExpense({
        id: 'custom',
        originalCategoryId: 'food',
        originalSubCategoryId: 'custom-sub-uuid',
      }),
    ];

    const result = restoreMigratedExpensesOnCategoryReset(
      expenses,
      subs,
      SUB_CATEGORY_DELETE_FALLBACK_ID,
    );

    expect(result[0].category).toBe(SUB_CATEGORY_DELETE_FALLBACK_ID);
    expect(result[0].originalSubCategoryId).toBe('custom-sub-uuid');
  });

  it('restores pending recurrence category independently of live category', () => {
    const { subs } = buildDefaultCategorySeed();
    const expenses: Expense[] = [
      makeExpense({
        id: 'pending',
        category: 'food.restaurants',
        recurrencePendingBasicFields: {
          effectiveFromIso: '2026-09-01',
          description: { en: 'Later', he: 'Later' },
          amount: 20,
          category: SUB_CATEGORY_DELETE_FALLBACK_ID,
          paymentMethod: 'cash',
          originalCategoryId: 'food',
          originalSubCategoryId: 'food.groceries',
        },
      }),
    ];

    const result = restoreMigratedExpensesOnCategoryReset(
      expenses,
      subs,
      SUB_CATEGORY_DELETE_FALLBACK_ID,
    );

    expect(result[0].category).toBe('food.restaurants');
    expect(result[0].recurrencePendingBasicFields?.category).toBe('food.groceries');
    expect(result[0].recurrencePendingBasicFields?.originalSubCategoryId).toBeUndefined();
  });
});
