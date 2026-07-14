import { useState, useEffect, useCallback } from 'react';
import { type CustomCategory } from '../../../types/category';
import { loadCategories, saveCategory } from '../../../services/categories/categoryRepository';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { generateExpenseId } from '../../../domain/expenses/generateId';
import { type AppLocale } from '../../../config/app';

export interface UseCategoriesReturn {
  customCategories: CustomCategory[];
  isAddingCategory: boolean;
  addCategoryError: string | null;
  loadCategoryError: string | null;
  addCustomCategory: (name: string, locale: AppLocale) => Promise<void>;
  clearAddCategoryError: () => void;
  clearLoadCategoryError: () => void;
}

export function useCategories(userId: string | null): UseCategoriesReturn {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);
  const [loadCategoryError, setLoadCategoryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadCategoryError(null);
      try {
        const categories = await loadCategories(userId);
        if (!cancelled) setCustomCategories(categories);
      } catch (e) {
        console.warn('[useCategories] Could not load categories:', e);
        if (!cancelled) setLoadCategoryError('loadFailed');
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const addCustomCategory = useCallback(
    async (name: string, locale: AppLocale) => {
      if (!name.trim()) return;
      setIsAddingCategory(true);
      setAddCategoryError(null);
      try {
        const labels = await createBilingualText(name.trim(), locale);
        const category: CustomCategory = {
          id: generateExpenseId(),
          labels,
          createdAt: new Date().toISOString(),
        };
        await saveCategory(userId, category);
        setCustomCategories((prev) => [...prev, category]);
      } catch {
        setAddCategoryError('translationError');
      } finally {
        setIsAddingCategory(false);
      }
    },
    [userId],
  );

  const clearAddCategoryError = useCallback(() => setAddCategoryError(null), []);
  const clearLoadCategoryError = useCallback(() => setLoadCategoryError(null), []);

  return {
    customCategories,
    isAddingCategory,
    addCategoryError,
    loadCategoryError,
    addCustomCategory,
    clearAddCategoryError,
    clearLoadCategoryError,
  };
}
