import { describe, expect, it } from 'vitest';
import { buildDefaultCategorySeed } from './seedDefaultCategories';
import { mergeSubCategoryRecords } from './mergeSubCategoryRecords';

describe('mergeSubCategoryRecords', () => {
  it('preserves subs not included in the update batch', () => {
    const { subs } = buildDefaultCategorySeed();
    const foodSub = subs.find((s) => s.id === 'food.groceries')!;
    const transportSub = subs.find((s) => s.id === 'transport.fuel')!;

    const merged = mergeSubCategoryRecords(subs, [
      { ...foodSub, color: 'bg-red-500' },
    ]);

    expect(merged).toHaveLength(subs.length);
    expect(merged.find((s) => s.id === 'food.groceries')?.color).toBe('bg-red-500');
    expect(merged.find((s) => s.id === 'transport.fuel')).toEqual(transportSub);
  });
});
