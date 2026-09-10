import { describe, expect, it } from 'vitest';
import { type MainCategoryRecord, type SubCategoryRecord } from '../../types/category';
import {
  categoryRowToRaw,
  mainCategoryToRow,
  subCategoryToRow,
} from './categoryRowMapper';

describe('category row mapper', () => {
  it('maps a main category with null parent', () => {
    const category: MainCategoryRecord = {
      id: 'food',
      parentId: null,
      labels: { en: 'Food', he: 'אוכל' },
      icon: 'utensils',
      color: '#f00',
      sortOrder: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const row = mainCategoryToRow('user-1', 'master', category);
    expect(row.parent_id).toBeNull();
    expect(row.profile_id).toBe('master');
    expect(categoryRowToRaw(row).parentId).toBeNull();
  });

  it('maps a subcategory with parent id', () => {
    const category: SubCategoryRecord = {
      id: 'food.groceries',
      parentId: 'food',
      labels: { en: 'Groceries', he: 'מכולת' },
      icon: 'cart',
      color: '#0f0',
      sortOrder: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const row = subCategoryToRow('user-1', 'budget-1', category);
    expect(row.parent_id).toBe('food');
    expect(row.profile_id).toBe('budget-1');
    expect(categoryRowToRaw(row).parentId).toBe('food');
  });
});
