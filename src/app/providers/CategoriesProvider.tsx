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
} from '../../types/category';
import {
  ensureDefaultCategoriesSeeded,
  saveMainCategory,
  saveMainCategoriesOrder,
  deleteMainCategoryRecord,
  saveSubCategory,
  saveSubCategories,
  resetCategoriesToDefaults,
} from '../../services/categories/categoryRepository';
import { createBilingualText } from '../../services/translation/createBilingualText';
import { generateExpenseId } from '../../domain/expenses/generateId';
import { type AppLocale } from '../../config/app';
import {
  buildNewMainCategoryWithDefaultSub,
  deleteMainCategory,
  reorderMainCategories,
} from '../../domain/categories/deleteMainCategory';
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
  clearAddCategoryError: () => void;
  clearLoadCategoryError: () => void;
  clearMainCategoryActionError: () => void;
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

  const clearAddCategoryError = useCallback(() => setAddCategoryError(null), []);
  const clearLoadCategoryError = useCallback(() => setLoadCategoryError(null), []);
  const clearMainCategoryActionError = useCallback(() => setMainCategoryActionError(null), []);

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
      clearAddCategoryError,
      clearLoadCategoryError,
      clearMainCategoryActionError,
    }),
    [
      mainCategories,
      subCategories,
      isLoading,
      isAddingCategory,
      isSavingMainCategory,
      isResettingCategories,
      addCategoryError,
      loadCategoryError,
      mainCategoryActionError,
      addCustomCategory,
      addMainCategory,
      updateMainCategory,
      deleteMainCategoryAction,
      reorderMainCategoriesAction,
      resetCategoriesToDefaultsAction,
      clearAddCategoryError,
      clearLoadCategoryError,
      clearMainCategoryActionError,
    ],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}
