import { describe, expect, it } from 'vitest';
import {
  buildNewMainCategoryWithDefaultSub,
  deleteMainCategory,
  reorderMainCategories,
} from './deleteMainCategory';
import { buildDefaultCategorySeed } from './seedDefaultCategories';

describe('deleteMainCategory', () => {
  it('reassigns subs to other with other color while preserving labels and icons', () => {
    const { mains, subs } = buildDefaultCategorySeed();
    const foodSub = subs.find((s) => s.id === 'food.groceries')!;
    const otherMain = mains.find((m) => m.id === 'other')!;

    const result = deleteMainCategory(mains, subs, 'food');
    expect(result).not.toBe('cannotDeleteOther');
    if (result === 'cannotDeleteOther') return;

    expect(result.mains.some((m) => m.id === 'food')).toBe(false);
    const migrated = result.subs.find((s) => s.id === 'food.groceries')!;
    expect(migrated.parentId).toBe('other');
    expect(migrated.color).toBe(otherMain.color);
    expect(migrated.labels).toEqual(foodSub.labels);
    expect(migrated.icon).toBe(foodSub.icon);
  });

  it('blocks deleting the protected other category', () => {
    const { mains, subs } = buildDefaultCategorySeed();
    expect(deleteMainCategory(mains, subs, 'other')).toBe('cannotDeleteOther');
  });
});

describe('buildNewMainCategoryWithDefaultSub', () => {
  it('creates exactly one default sub matching main name icon and color', () => {
    const input = {
      labels: { en: 'Pets', he: 'חיות' },
      icon: 'paw-print',
      color: 'bg-teal-500',
    };
    const { main, sub } = buildNewMainCategoryWithDefaultSub(
      input,
      'main-1',
      'sub-1',
      3,
      '2026-07-18T00:00:00.000Z',
    );

    expect(main.parentId).toBeNull();
    expect(sub.parentId).toBe('main-1');
    expect(sub.labels).toEqual(input.labels);
    expect(sub.icon).toBe(input.icon);
    expect(sub.color).toBe(input.color);
    expect(sub.sortOrder).toBe(0);
  });
});

describe('reorderMainCategories', () => {
  it('recomputes sortOrder according to ordered ids', () => {
    const { mains } = buildDefaultCategorySeed();
    const ids = ['shopping', 'food', 'other'];
    const reordered = reorderMainCategories(mains, ids);
    expect(reordered.slice(0, 3).map((m) => m.id)).toEqual(ids);
    expect(reordered[0].sortOrder).toBe(0);
    expect(reordered[1].sortOrder).toBe(1);
    expect(reordered[2].sortOrder).toBe(2);
  });
});
