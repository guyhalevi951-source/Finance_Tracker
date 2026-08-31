import { describe, expect, it } from 'vitest';
import {
  buildNewSubCategory,
  deleteSubCategoryPolicy,
  missingBuiltinSubsToRestore,
  moveSubCategoryToParent,
  reassignExpensesOnSubCategoryDelete,
  reorderSubCategories,
  resolveOtherMiscellaneousSubCategoryId,
  SUB_CATEGORY_DELETE_FALLBACK_ID,
} from './deleteSubCategory';
import { buildDefaultCategorySeed } from './seedDefaultCategories';
import { type Expense } from '../../types/expense';

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    description: { en: 'Test', he: 'Test' },
    amount: 10,
    category: 'food.groceries',
    date: '2026-08-31',
    paymentMethod: 'cash',
    ...overrides,
  };
}

describe('buildNewSubCategory', () => {
  it('inherits parent main color and parentId', () => {
    const { mains } = buildDefaultCategorySeed();
    const foodMain = mains.find((m) => m.id === 'food')!;
    const sub = buildNewSubCategory(
      { labels: { en: 'Snacks', he: 'חטיפים' }, icon: 'cookie' },
      foodMain,
      'custom-sub-1',
      5,
      '2026-07-19T00:00:00.000Z',
    );

    expect(sub.parentId).toBe('food');
    expect(sub.color).toBe(foodMain.color);
    expect(sub.sortOrder).toBe(5);
  });
});

describe('reorderSubCategories', () => {
  it('recomputes sortOrder within one parent only', () => {
    const { subs } = buildDefaultCategorySeed();
    const foodSubs = subs.filter((s) => s.parentId === 'food');
    const ids = [...foodSubs].reverse().map((s) => s.id);
    const reordered = reorderSubCategories(subs, 'food', ids);
    const updatedFoodSubs = reordered
      .filter((s) => s.parentId === 'food')
      .sort((a, b) => a.sortOrder - b.sortOrder);

    expect(updatedFoodSubs.map((s) => s.id)).toEqual(ids);
    expect(updatedFoodSubs[0].sortOrder).toBe(0);
    expect(reordered.filter((s) => s.parentId === 'transport')).toHaveLength(
      subs.filter((s) => s.parentId === 'transport').length,
    );
  });
});

describe('moveSubCategoryToParent', () => {
  it('updates parentId, color, and sortOrder at end of target parent', () => {
    const { mains, subs } = buildDefaultCategorySeed();
    const foodSub = subs.find((s) => s.id === 'food.groceries')!;
    const shoppingMain = mains.find((m) => m.id === 'shopping')!;
    const shoppingCount = subs.filter((s) => s.parentId === 'shopping').length;

    const moved = moveSubCategoryToParent(foodSub, shoppingMain, subs);
    expect(moved.parentId).toBe('shopping');
    expect(moved.color).toBe(shoppingMain.color);
    expect(moved.sortOrder).toBe(shoppingCount);
  });
});

describe('deleteSubCategoryPolicy', () => {
  it('blocks deleting the last sub under a main', () => {
    const { mains, subs } = buildDefaultCategorySeed();
    const customMain = mains[0];
    const onlySub = subs.find((s) => s.parentId === customMain.id)!;
    const isolatedSubs = subs.filter((s) => s.parentId !== customMain.id);
    const catalog = [...isolatedSubs, onlySub];

    expect(deleteSubCategoryPolicy(catalog, onlySub.id)).toBe('cannotDeleteLastSub');
  });

  it('removes sub and returns other.miscellaneous fallback', () => {
    const { subs } = buildDefaultCategorySeed();
    const result = deleteSubCategoryPolicy(subs, 'food.groceries');
    expect(result).not.toBe('cannotDeleteLastSub');
    expect(result).not.toBe('cannotDeleteFallback');
    if (typeof result === 'string') return;

    expect(result.fallbackCategoryId).toBe(SUB_CATEGORY_DELETE_FALLBACK_ID);
    expect(result.subs.some((s) => s.id === 'food.groceries')).toBe(false);
    expect(result.subs.filter((s) => s.parentId === 'food').length).toBeGreaterThan(0);
  });

  it('blocks deleting the protected Miscellaneous fallback', () => {
    const { subs } = buildDefaultCategorySeed();
    expect(deleteSubCategoryPolicy(subs, SUB_CATEGORY_DELETE_FALLBACK_ID)).toBe(
      'cannotDeleteFallback',
    );
  });
});

describe('resolveOtherMiscellaneousSubCategoryId', () => {
  it('returns other.miscellaneous when present under protected other main', () => {
    const { subs } = buildDefaultCategorySeed();
    expect(resolveOtherMiscellaneousSubCategoryId(subs)).toBe('other.miscellaneous');
  });

  it('falls back to first sub under other when built-in id is missing', () => {
    const { subs } = buildDefaultCategorySeed();
    const withoutBuiltIn = subs.filter((s) => s.id !== 'other.miscellaneous');
    const customOtherSub = subs.find((s) => s.parentId === 'other' && s.id !== 'other.miscellaneous')!;

    expect(resolveOtherMiscellaneousSubCategoryId(withoutBuiltIn)).toBe(customOtherSub.id);
  });
});

describe('reassignExpensesOnSubCategoryDelete', () => {
  it('moves matching expenses and pending categories to other.miscellaneous', () => {
    const expenses: Expense[] = [
      makeExpense({ id: 'keep', category: 'food.restaurants' }),
      makeExpense({ id: 'move', category: 'food.groceries' }),
      makeExpense({
        id: 'pending',
        category: 'food.restaurants',
        recurrencePendingBasicFields: {
          effectiveFromIso: '2026-09-01',
          description: { en: 'Later', he: 'Later' },
          amount: 20,
          category: 'food.groceries',
          paymentMethod: 'cash',
        },
      }),
    ];

    const result = reassignExpensesOnSubCategoryDelete(
      expenses,
      'food.groceries',
      'food',
      SUB_CATEGORY_DELETE_FALLBACK_ID,
    );

    expect(result.find((e) => e.id === 'keep')?.category).toBe('food.restaurants');
    expect(result.find((e) => e.id === 'keep')?.originalSubCategoryId).toBeUndefined();
    expect(result.find((e) => e.id === 'move')?.category).toBe('other.miscellaneous');
    expect(result.find((e) => e.id === 'move')?.originalSubCategoryId).toBe('food.groceries');
    expect(result.find((e) => e.id === 'move')?.originalCategoryId).toBe('food');
    expect(result.find((e) => e.id === 'pending')?.category).toBe('food.restaurants');
    expect(result.find((e) => e.id === 'pending')?.originalSubCategoryId).toBeUndefined();
    expect(result.find((e) => e.id === 'pending')?.recurrencePendingBasicFields?.category).toBe(
      'other.miscellaneous',
    );
    expect(
      result.find((e) => e.id === 'pending')?.recurrencePendingBasicFields?.originalSubCategoryId,
    ).toBe('food.groceries');
    expect(
      result.find((e) => e.id === 'pending')?.recurrencePendingBasicFields?.originalCategoryId,
    ).toBe('food');
  });

  it('does not overwrite an existing migration origin', () => {
    const expenses: Expense[] = [
      makeExpense({
        id: 'already',
        category: 'food.restaurants',
        originalCategoryId: 'food',
        originalSubCategoryId: 'food.groceries',
      }),
    ];

    const result = reassignExpensesOnSubCategoryDelete(
      expenses,
      'food.restaurants',
      'food',
      SUB_CATEGORY_DELETE_FALLBACK_ID,
    );

    expect(result[0].category).toBe('other.miscellaneous');
    expect(result[0].originalSubCategoryId).toBe('food.groceries');
    expect(result[0].originalCategoryId).toBe('food');
  });
});

describe('missingBuiltinSubsToRestore', () => {
  it('does not restore a builtin sub the user deleted', () => {
    const { subs } = buildDefaultCategorySeed();
    const existingIds = new Set(subs.filter((s) => s.id !== 'entertainment.movies').map((s) => s.id));
    const deletedIds = new Set(['entertainment.movies']);

    const missing = missingBuiltinSubsToRestore(subs, existingIds, deletedIds);
    expect(missing.map((s) => s.id)).not.toContain('entertainment.movies');
  });
});
