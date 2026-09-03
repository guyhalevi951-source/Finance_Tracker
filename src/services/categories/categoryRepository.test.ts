import { describe, expect, it, beforeEach } from 'vitest';
import { MASTER_BUDGET_ID } from '../../domain/budget/constants';
import {
  ensureDefaultCategoriesSeeded,
  loadMainCategories,
  saveMainCategory,
} from './categoryRepository';
import { type MainCategoryRecord } from '../../types/category';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('categoryRepository profile scoping', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });
  it('keeps separate catalogs per profile for guest users', async () => {
    await ensureDefaultCategoriesSeeded(null, MASTER_BUDGET_ID);
    await ensureDefaultCategoriesSeeded(null, 'sub-1');

    const customMain: MainCategoryRecord = {
      id: 'custom-main',
      parentId: null,
      labels: { en: 'Custom', he: 'מותאם' },
      icon: 'tag',
      color: '#000000',
      sortOrder: 99,
      createdAt: new Date().toISOString(),
    };

    await saveMainCategory(null, 'sub-1', customMain);

    const subMains = await loadMainCategories(null, 'sub-1');
    const masterMains = await loadMainCategories(null, MASTER_BUDGET_ID);

    expect(subMains.some((main) => main.id === 'custom-main')).toBe(true);
    expect(masterMains.some((main) => main.id === 'custom-main')).toBe(false);
  });
});
