import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  beginAddExpenseCategoryCreate,
  beginAddExpenseSubCategoryCreate,
  categoryBgSwatchToTextClass,
  CATEGORY_RETURN_SUB_PARENT_KEY,
  CATEGORY_RETURN_TO_ADD_EXPENSE_KEY,
  resolvePostMainCategoryCreateNavigation,
  resolvePostSubCategoryCreateNavigation,
} from './categoryNavigation';

function createSessionStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('categoryNavigation', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', createSessionStorageMock());
  });

  it('beginAddExpenseCategoryCreate sets return key and clears sub parent', () => {
    sessionStorage.setItem(CATEGORY_RETURN_SUB_PARENT_KEY, 'food');
    beginAddExpenseCategoryCreate();
    expect(sessionStorage.getItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY)).toBe('1');
    expect(sessionStorage.getItem(CATEGORY_RETURN_SUB_PARENT_KEY)).toBeNull();
  });

  it('beginAddExpenseSubCategoryCreate sets both keys', () => {
    beginAddExpenseSubCategoryCreate('transport');
    expect(sessionStorage.getItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY)).toBe('1');
    expect(sessionStorage.getItem(CATEGORY_RETURN_SUB_PARENT_KEY)).toBe('transport');
  });

  it('resolvePostMainCategoryCreateNavigation returns addExpense when return key set', () => {
    beginAddExpenseCategoryCreate();
    expect(resolvePostMainCategoryCreateNavigation()).toEqual({
      destination: 'addExpense',
      view: 'main',
    });
    expect(sessionStorage.getItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY)).toBeNull();
  });

  it('resolvePostMainCategoryCreateNavigation returns management by default', () => {
    expect(resolvePostMainCategoryCreateNavigation()).toEqual({ destination: 'management' });
  });

  it('resolvePostSubCategoryCreateNavigation returns addExpense sub view with parent', () => {
    beginAddExpenseSubCategoryCreate('food');
    expect(resolvePostSubCategoryCreateNavigation('food')).toEqual({
      destination: 'addExpense',
      view: 'sub',
      parentId: 'food',
    });
  });

  it('resolvePostSubCategoryCreateNavigation returns subManagement by default', () => {
    expect(resolvePostSubCategoryCreateNavigation('food')).toEqual({
      destination: 'subManagement',
      mainId: 'food',
    });
  });

  it('categoryBgSwatchToTextClass maps bg swatch to text class', () => {
    expect(categoryBgSwatchToTextClass('bg-emerald-500')).toBe('text-emerald-500');
  });
});
