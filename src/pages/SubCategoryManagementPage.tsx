import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { SubCategoryManagementList } from '../features/categories/components/SubCategoryManagementList';
import {
  ROUTES,
  categorySubCreatePath,
} from '../config/routes';
import {
  CATEGORY_RETURN_SUB_PARENT_KEY,
  CATEGORY_RETURN_TO_ADD_EXPENSE_KEY,
} from '../config/categoryNavigation';
import { type AppLocale } from '../config/app';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';

export function SubCategoryManagementPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const { mainId } = useParams<{ mainId: string }>();
  const { userId } = useAuthSession();

  const {
    mainCategories,
    subCategories,
    isLoading,
    loadCategoryError,
    subCategoryActionError,
    deleteSubCategoryAction,
    reorderSubCategoriesAction,
    isSavingSubCategory,
  } = useCategories(userId);

  const parentMain = useMemo(
    () => mainCategories.find((main) => main.id === mainId),
    [mainCategories, mainId],
  );

  const parentLabel = parentMain ? resolveBilingualText(parentMain.labels, locale) : '';

  useAppHeader({
    title: parentMain
      ? t('category.subManagement.titleWithParent', { name: parentLabel })
      : t('category.subManagement.title'),
  });

  const handleBack = useCallback(() => {
    const returnToAddExpense = sessionStorage.getItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY);
    const returnParentId = sessionStorage.getItem(CATEGORY_RETURN_SUB_PARENT_KEY);

    if (returnToAddExpense && returnParentId) {
      sessionStorage.removeItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY);
      sessionStorage.removeItem(CATEGORY_RETURN_SUB_PARENT_KEY);
      navigate(ROUTES.expenses, {
        state: { openAddExpenseSubCategories: returnParentId },
      });
      return;
    }

    navigate(ROUTES.categoryManagement);
  }, [navigate]);

  const isBusy = isSavingSubCategory;

  if (!mainId) {
    return (
      <p className="text-center py-12 text-slate-500 dark:text-slate-400">
        {t('category.subManagement.notFound')}
      </p>
    );
  }

  return (
    <div className="relative pb-28">
      <div className="flex items-center gap-2 mb-4 -mt-1">
        <button
          type="button"
          onClick={handleBack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label={t('category.subManagement.back')}
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t('category.subManagement.back')}
        </span>
      </div>

      {loadCategoryError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('category.loadError')}
        </div>
      )}

      {subCategoryActionError && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t(`category.subManagement.errors.${subCategoryActionError}`)}
        </div>
      )}

      {isLoading ? (
        <p className="text-center py-12 text-slate-500 dark:text-slate-400">
          {t('category.subManagement.loading')}
        </p>
      ) : !parentMain ? (
        <p className="text-center py-12 text-slate-500 dark:text-slate-400">
          {t('category.subManagement.notFound')}
        </p>
      ) : (
        <SubCategoryManagementList
          locale={locale}
          parentMain={parentMain}
          mainCategories={mainCategories}
          subCategories={subCategories}
          onReorder={(orderedIds) => void reorderSubCategoriesAction(mainId, orderedIds)}
          onDelete={deleteSubCategoryAction}
          isDeleting={isBusy}
        />
      )}

      {parentMain && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900">
          <button
            type="button"
            onClick={() => navigate(categorySubCreatePath(mainId))}
            disabled={isBusy || !parentMain}
            className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-900 font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            {t('category.subManagement.addButton')}
          </button>
        </div>
      )}
    </div>
  );
}
