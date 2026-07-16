import { describe, expect, it } from 'vitest';
import {
  getAllBuiltinSubCategoryIds,
  getParentCategoryId,
  getSubCategoriesForParent,
  isBuiltinSubCategoryId,
  LEGACY_FLAT_TO_SUB_MIGRATION,
  migrateToSubCategoryId,
} from './hierarchy';

describe('hierarchy', () => {
  it('exposes all sub-categories as parent.sub dot notation', () => {
    const ids = getAllBuiltinSubCategoryIds();
    expect(ids).toContain('food.groceries');
    expect(ids).toContain('housing.rent');
    expect(ids.every((id) => id.includes('.'))).toBe(true);
  });

  it('resolves parent from sub ID', () => {
    expect(getParentCategoryId('food.groceries')).toBe('food');
    expect(getParentCategoryId('housing.rent')).toBe('housing');
  });

  it('resolves parent from legacy flat IDs', () => {
    expect(getParentCategoryId('food')).toBe('food');
    expect(getParentCategoryId('rent')).toBe('housing');
    expect(getParentCategoryId('other')).toBe('other');
  });

  it('migrates legacy flat IDs to sub IDs', () => {
    for (const [flat, sub] of Object.entries(LEGACY_FLAT_TO_SUB_MIGRATION)) {
      expect(migrateToSubCategoryId(flat, {})).toBe(sub);
    }
  });

  it('migrates legacy Hebrew strings via map', () => {
    expect(migrateToSubCategoryId('אוכל', { 'אוכל': 'food' })).toBe('food.groceries');
    expect(migrateToSubCategoryId('שכר דירה', { 'שכר דירה': 'rent' })).toBe('housing.rent');
  });

  it('passes through custom UUIDs unchanged', () => {
    const customId = 'abc-123-custom';
    expect(migrateToSubCategoryId(customId, {})).toBe(customId);
  });

  it('lists subs per parent', () => {
    const foodSubs = getSubCategoriesForParent('food');
    expect(foodSubs).toHaveLength(5);
    expect(isBuiltinSubCategoryId(foodSubs[0]!)).toBe(true);
  });
});
