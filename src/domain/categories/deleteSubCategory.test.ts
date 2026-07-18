import { describe, expect, it } from 'vitest';
import {
  buildNewSubCategory,
  deleteSubCategoryPolicy,
  moveSubCategoryToParent,
  reorderSubCategories,
  SUB_CATEGORY_DELETE_FALLBACK_ID,
} from './deleteSubCategory';
import { buildDefaultCategorySeed } from './seedDefaultCategories';

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
    if (result === 'cannotDeleteLastSub') return;

    expect(result.fallbackCategoryId).toBe(SUB_CATEGORY_DELETE_FALLBACK_ID);
    expect(result.subs.some((s) => s.id === 'food.groceries')).toBe(false);
    expect(result.subs.filter((s) => s.parentId === 'food').length).toBeGreaterThan(0);
  });
});
