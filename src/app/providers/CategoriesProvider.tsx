import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type MainCategoryRecord,
  type SubCategoryRecord,
  type MainCategoryInput,
  type SubCategoryInput,
} from '../../types/category';
import {
  ensureDefaultCategoriesSeeded,
  saveMainCategory,
  saveMainCategoriesOrder,
  deleteMainCategoryRecord,
  saveSubCategory,
  saveSubCategories,
  deleteSubCategory,
  resetCategoriesToDefaults,
} from '../../services/categories/categoryRepository';
import { reassignExpensesCategory } from '../../services/expenses/expenseRepository';
import { createBilingualText } from '../../services/translation/createBilingualText';
import { generateExpenseId } from '../../domain/expenses/generateId';
import { type AppLocale } from '../../config/app';
import {
  buildNewMainCategoryWithDefaultSub,
  deleteMainCategory,
  reorderMainCategories,
} from '../../domain/categories/deleteMainCategory';
import {
  buildNewSubCategory,
  deleteSubCategoryPolicy,
  moveSubCategoryToParent,
  reorderSubCategories,
} from '../../domain/categories/deleteSubCategory';
import { sortMainCategories } from '../../domain/categories/seedDefaultCategories';
import {
  DEFAULT_CATEGORY_ICON_KEY,
  isValidCategoryIconKey,
} from '../../domain/categories/categoryIconLibrary';
import { DEFAULT_CATEGORY_COLOR, isValidCategoryColor } from '../../domain/categories/categoryColorPalette';
import { PROTECTED_MAIN_CATEGORY_ID } from '../../domain/categories/reassignSubCategoriesOnDelete';
import { useAuthSession } from '../../features/auth/hooks/useAuthSession';

export interface CategoriesContextValue {
  mainCategories: MainCategoryRecord[];
  subCategories: SubCategoryRecord[];
  /** @deprecated Use subCategories */
  customCategories: SubCategoryRecord[];
  isLoading: boolean;
  isAddingCategory: boolean;
  isSavingMainCategory: boolean;
  addCategoryError: string | null;
  loadCategoryError: string | null;
  mainCategoryActionError: string | null;
  addCustomCategory: (name: string, locale: AppLocale) => Promise<void>;
  addMainCategory: (input: MainCategoryInput, locale: AppLocale) => Promise<MainCategoryRecord | null>;
  updateMainCategory: (
    mainId: string,
    input: MainCategoryInput,
    locale: AppLocale,
  ) => Promise<MainCategoryRecord | null>;
  deleteMainCategoryAction: (mainId: string) => Promise<boolean>;
  reorderMainCategoriesAction: (orderedIds: string[]) => Promise<void>;
  resetCategoriesToDefaultsAction: () => Promise<boolean>;
  isResettingCategories: boolean;
  isSavingSubCategory: boolean;
  subCategoryActionError: string | null;
  addSubCategory: (
    parentId: string,
    input: SubCategoryInput,
    locale: AppLocale,
  ) => Promise<SubCategoryRecord | null>;
  updateSubCategory: (
    subId: string,
    input: SubCategoryInput,
    locale: AppLocale,
  ) => Promise<SubCategoryRecord | null>;
  deleteSubCategoryAction: (subId: string) => Promise<boolean>;
  reorderSubCategoriesAction: (parentId: string, orderedIds: string[]) => Promise<void>;
  moveSubCategoryAction: (subId: string, newParentId: string) => Promise<SubCategoryRecord | null>;
  clearAddCategoryError: () => void;
  clearLoadCategoryError: () => void;
  clearMainCategoryActionError: () => void;
  clearSubCategoryActionError: () => void;
}

export const CategoriesContext = createContext<CategoriesContextValue | null>(null);

interface CategoriesProviderProps {
  children: ReactNode;
}

export function CategoriesProvider({ children }: CategoriesProviderProps) {
  const { userId } = useAuthSession();
  const [mainCategories, setMainCategories] = useState<MainCategoryRecord[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isSavingMainCategory, setIsSavingMainCategory] = useState(false);
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null);
  const [loadCategoryError, setLoadCategoryError] = useState<string | null>(null);
  const [mainCategoryActionError, setMainCategoryActionError] = useState<string | null>(null);
  const [isResettingCategories, setIsResettingCategories] = useState(false);
  const [isSavingSubCategory, setIsSavingSubCategory] = useState(false);
  const [subCategoryActionError, setSubCategoryActionError] = useState<string | null>(null);

  const applyCatalog = useCallback((catalog: Awaited<ReturnType<typeof ensureDefaultCategoriesSeeded>>) => {
    setMainCategories(sortMainCategories(catalog.mainCategories));
    setSubCategories(catalog.subCategories);
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadCategoryError(null);
    try {
      const catalog = await ensureDefaultCategoriesSeeded(userId);
      applyCatalog(catalog);
    } catch (e) {
      console.warn('[CategoriesProvider] Could not load categories:', e);
      setLoadCategoryError('loadFailed');
    } finally {
      setIsLoading(false);
    }
  }, [userId, applyCatalog]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addCustomCategory = useCallback(
    async (name: string, locale: AppLocale) => {
      if (!name.trim()) return;
      setIsAddingCategory(true);
      setAddCategoryError(null);
      try {
        const labels = await createBilingualText(name.trim(), locale);
        const otherMain = mainCategories.find((m) => m.id === PROTECTED_MAIN_CATEGORY_ID);
        const category: SubCategoryRecord = {
          id: generateExpenseId(),
          parentId: PROTECTED_MAIN_CATEGORY_ID,
          labels,
          icon: DEFAULT_CATEGORY_ICON_KEY,
          color: otherMain?.color ?? DEFAULT_CATEGORY_COLOR,
          sortOrder: subCategories.filter((s) => s.parentId === PROTECTED_MAIN_CATEGORY_ID).length,
          createdAt: new Date().toISOString(),
        };
        await saveSubCategory(userId, category);
        await reload();
      } catch {
        setAddCategoryError('translationError');
      } finally {
        setIsAddingCategory(false);
      }
    },
    [userId, mainCategories, subCategories, reload],
  );

  const addMainCategory = useCallback(
    async (input: MainCategoryInput, locale: AppLocale): Promise<MainCategoryRecord | null> => {
      if (!input.labels.en.trim() && !input.labels.he.trim()) return null;
      setIsSavingMainCategory(true);
      setMainCategoryActionError(null);
      try {
        const labels =
          input.labels.en && input.labels.he
            ? input.labels
            : await createBilingualText(
                (locale === 'en' ? input.labels.en : input.labels.he).trim() ||
                  input.labels.en.trim() ||
                  input.labels.he.trim(),
                locale,
              );

        const mainId = generateExpenseId();
        const subId = generateExpenseId();
        const createdAt = new Date().toISOString();
        const sortOrder = mainCategories.length;
        const normalizedInput: MainCategoryInput = {
          labels,
          icon: isValidCategoryIconKey(input.icon) ? input.icon : DEFAULT_CATEGORY_ICON_KEY,
          color: isValidCategoryColor(input.color) ? input.color : DEFAULT_CATEGORY_COLOR,
        };

        const { main, sub } = buildNewMainCategoryWithDefaultSub(
          normalizedInput,
          mainId,
          subId,
          sortOrder,
          createdAt,
        );

        await saveMainCategory(userId, main);
        await saveSubCategory(userId, sub);
        await reload();
        return main;
      } catch {
        setMainCategoryActionError('saveFailed');
        return null;
      } finally {
        setIsSavingMainCategory(false);
      }
    },
    [userId, mainCategories.length, reload],
  );

  const updateMainCategory = useCallback(
    async (
      mainId: string,
      input: MainCategoryInput,
      locale: AppLocale,
    ): Promise<MainCategoryRecord | null> => {
      const existing = mainCategories.find((m) => m.id === mainId);
      if (!existing) return null;

      setIsSavingMainCategory(true);
      setMainCategoryActionError(null);
      try {
        const labels =
          input.labels.en && input.labels.he
            ? input.labels
            : await createBilingualText(
                (locale === 'en' ? input.labels.en : input.labels.he).trim() ||
                  existing.labels[locale].trim(),
                locale,
              );

        const updatedMain: MainCategoryRecord = {
          ...existing,
          labels,
          icon: isValidCategoryIconKey(input.icon) ? input.icon : existing.icon,
          color: isValidCategoryColor(input.color) ? input.color : existing.color,
        };

        const updatedSubs = subCategories.map((sub) => {
          if (sub.parentId !== mainId) return sub;
          const isDefaultSub =
            sub.sortOrder === 0 &&
            subCategories.filter((s) => s.parentId === mainId).length === 1;
          if (isDefaultSub) {
            return {
              ...sub,
              labels,
              icon: updatedMain.icon,
              color: updatedMain.color,
            };
          }
          return { ...sub, color: updatedMain.color };
        });

        await saveMainCategory(userId, updatedMain);
        await saveSubCategories(
          userId,
          updatedSubs.filter((s) => s.parentId === mainId),
        );
        await reload();
        return updatedMain;
      } catch {
        setMainCategoryActionError('saveFailed');
        return null;
      } finally {
        setIsSavingMainCategory(false);
      }
    },
    [userId, mainCategories, subCategories, reload],
  );

  const deleteMainCategoryAction = useCallback(
    async (mainId: string): Promise<boolean> => {
      setMainCategoryActionError(null);
      const result = deleteMainCategory(mainCategories, subCategories, mainId);
      if (result === 'cannotDeleteOther') {
        setMainCategoryActionError('cannotDeleteOther');
        return false;
      }

      try {
        await deleteMainCategoryRecord(userId, mainId);
        await saveSubCategories(userId, result.subs);
        await reload();
        return true;
      } catch {
        setMainCategoryActionError('deleteFailed');
        return false;
      }
    },
    [userId, mainCategories, subCategories, reload],
  );

  const reorderMainCategoriesAction = useCallback(
    async (orderedIds: string[]) => {
      const reordered = reorderMainCategories(mainCategories, orderedIds);
      setMainCategories(reordered);
      try {
        await saveMainCategoriesOrder(userId, reordered);
      } catch {
        setMainCategoryActionError('reorderFailed');
      }
    },
    [userId, mainCategories],
  );

  const resetCategoriesToDefaultsAction = useCallback(async (): Promise<boolean> => {
    setIsResettingCategories(true);
    setMainCategoryActionError(null);
    try {
      const catalog = await resetCategoriesToDefaults(userId);
      applyCatalog(catalog);
      return true;
    } catch {
      setMainCategoryActionError('resetFailed');
      return false;
    } finally {
      setIsResettingCategories(false);
    }
  }, [userId, applyCatalog]);

  const addSubCategory = useCallback(
    async (
      parentId: string,
      input: SubCategoryInput,
      locale: AppLocale,
    ): Promise<SubCategoryRecord | null> => {
      const parentMain = mainCategories.find((main) => main.id === parentId);
      if (!parentMain) return null;
      if (!input.labels.en.trim() && !input.labels.he.trim()) return null;

      setIsSavingSubCategory(true);
      setSubCategoryActionError(null);
      try {
        const labels =
          input.labels.en && input.labels.he
            ? input.labels
            : await createBilingualText(
                (locale === 'en' ? input.labels.en : input.labels.he).trim() ||
                  input.labels.en.trim() ||
                  input.labels.he.trim(),
                locale,
              );

        const normalizedInput: SubCategoryInput = {
          labels,
          icon: isValidCategoryIconKey(input.icon) ? input.icon : DEFAULT_CATEGORY_ICON_KEY,
        };
        const sortOrder = subCategories.filter((sub) => sub.parentId === parentId).length;
        const sub = buildNewSubCategory(
          normalizedInput,
          parentMain,
          generateExpenseId(),
          sortOrder,
          new Date().toISOString(),
        );

        await saveSubCategory(userId, sub);
        await reload();
        return sub;
      } catch {
        setSubCategoryActionError('saveFailed');
        return null;
      } finally {
        setIsSavingSubCategory(false);
      }
    },
    [userId, mainCategories, subCategories, reload],
  );

  const updateSubCategory = useCallback(
    async (
      subId: string,
      input: SubCategoryInput,
      locale: AppLocale,
    ): Promise<SubCategoryRecord | null> => {
      const existing = subCategories.find((sub) => sub.id === subId);
      if (!existing) return null;
      const parentMain = mainCategories.find((main) => main.id === existing.parentId);
      if (!parentMain) return null;

      setIsSavingSubCategory(true);
      setSubCategoryActionError(null);
      try {
        const labels =
          input.labels.en && input.labels.he
            ? input.labels
            : await createBilingualText(
                (locale === 'en' ? input.labels.en : input.labels.he).trim() ||
                  existing.labels[locale].trim(),
                locale,
              );

        const updated: SubCategoryRecord = {
          ...existing,
          labels,
          icon: isValidCategoryIconKey(input.icon) ? input.icon : existing.icon,
          color: parentMain.color,
        };

        await saveSubCategory(userId, updated);
        await reload();
        return updated;
      } catch {
        setSubCategoryActionError('saveFailed');
        return null;
      } finally {
        setIsSavingSubCategory(false);
      }
    },
    [userId, mainCategories, subCategories, reload],
  );

  const deleteSubCategoryAction = useCallback(
    async (subId: string): Promise<boolean> => {
      setSubCategoryActionError(null);
      const result = deleteSubCategoryPolicy(subCategories, subId);
      if (result === 'cannotDeleteLastSub') {
        setSubCategoryActionError('cannotDeleteLastSub');
        return false;
      }

      try {
        await reassignExpensesCategory(userId, subId, result.fallbackCategoryId);
        await deleteSubCategory(userId, subId);
        const parentId = subCategories.find((sub) => sub.id === subId)?.parentId;
        if (parentId) {
          const remaining = result.subs.filter((sub) => sub.parentId === parentId);
          await saveSubCategories(userId, remaining);
        }
        await reload();
        return true;
      } catch {
        setSubCategoryActionError('deleteFailed');
        return false;
      }
    },
    [userId, subCategories, reload],
  );

  const reorderSubCategoriesAction = useCallback(
    async (parentId: string, orderedIds: string[]) => {
      const reordered = reorderSubCategories(subCategories, parentId, orderedIds);
      setSubCategories(reordered);
      try {
        await saveSubCategories(
          userId,
          reordered.filter((sub) => sub.parentId === parentId),
        );
      } catch {
        setSubCategoryActionError('reorderFailed');
      }
    },
    [userId, subCategories],
  );

  const moveSubCategoryAction = useCallback(
    async (subId: string, newParentId: string): Promise<SubCategoryRecord | null> => {
      const existing = subCategories.find((sub) => sub.id === subId);
      const newParent = mainCategories.find((main) => main.id === newParentId);
      if (!existing || !newParent) return null;
      if (existing.parentId === newParentId) return existing;

      setIsSavingSubCategory(true);
      setSubCategoryActionError(null);
      try {
        const moved = moveSubCategoryToParent(existing, newParent, subCategories);
        await saveSubCategory(userId, moved);
        await reload();
        return moved;
      } catch {
        setSubCategoryActionError('moveFailed');
        return null;
      } finally {
        setIsSavingSubCategory(false);
      }
    },
    [userId, mainCategories, subCategories, reload],
  );

  const clearAddCategoryError = useCallback(() => setAddCategoryError(null), []);
  const clearLoadCategoryError = useCallback(() => setLoadCategoryError(null), []);
  const clearMainCategoryActionError = useCallback(() => setMainCategoryActionError(null), []);
  const clearSubCategoryActionError = useCallback(() => setSubCategoryActionError(null), []);

  const value = useMemo(
    () => ({
      mainCategories,
      subCategories,
      customCategories: subCategories,
      isLoading,
      isAddingCategory,
      isSavingMainCategory,
      addCategoryError,
      loadCategoryError,
      mainCategoryActionError,
      addCustomCategory,
      addMainCategory,
      updateMainCategory,
      deleteMainCategoryAction,
      reorderMainCategoriesAction,
      resetCategoriesToDefaultsAction,
      isResettingCategories,
      isSavingSubCategory,
      subCategoryActionError,
      addSubCategory,
      updateSubCategory,
      deleteSubCategoryAction,
      reorderSubCategoriesAction,
      moveSubCategoryAction,
      clearAddCategoryError,
      clearLoadCategoryError,
      clearMainCategoryActionError,
      clearSubCategoryActionError,
    }),
    [
      mainCategories,
      subCategories,
      isLoading,
      isAddingCategory,
      isSavingMainCategory,
      isResettingCategories,
      isSavingSubCategory,
      addCategoryError,
      loadCategoryError,
      mainCategoryActionError,
      subCategoryActionError,
      addCustomCategory,
      addMainCategory,
      updateMainCategory,
      deleteMainCategoryAction,
      reorderMainCategoriesAction,
      resetCategoriesToDefaultsAction,
      addSubCategory,
      updateSubCategory,
      deleteSubCategoryAction,
      reorderSubCategoriesAction,
      moveSubCategoryAction,
      clearAddCategoryError,
      clearLoadCategoryError,
      clearMainCategoryActionError,
      clearSubCategoryActionError,
    ],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}
