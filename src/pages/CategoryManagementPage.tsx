import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { CategoryManagementList } from '../features/categories/components/CategoryManagementList';
import { ResetCategoriesConfirmModal } from '../features/categories/components/ResetCategoriesConfirmModal';
import { ROUTES } from '../config/routes';
import { CATEGORY_RETURN_TO_ADD_EXPENSE_KEY } from '../config/categoryNavigation';
import { type AppLocale } from '../config/app';

export function CategoryManagementPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const { userId } = useAuthSession();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const {
    mainCategories,
    isLoading,
    loadCategoryError,
    mainCategoryActionError,
    deleteMainCategoryAction,
    reorderMainCategoriesAction,
    resetCategoriesToDefaultsAction,
    isSavingMainCategory,
    isResettingCategories,
  } = useCategories(userId);

  useAppHeader({ title: t('category.management.title') });

  const handleBack = useCallback(() => {
    if (sessionStorage.getItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY)) {
      sessionStorage.removeItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY);
      navigate(ROUTES.expenses, { state: { openAddExpenseCategories: true } });
    } else {
      navigate(ROUTES.expenses);
    }
  }, [navigate]);

  const handleResetConfirm = useCallback(async () => {
    const ok = await resetCategoriesToDefaultsAction();
    if (ok) setShowResetConfirm(false);
  }, [resetCategoriesToDefaultsAction]);

  const isBusy = isSavingMainCategory || isResettingCategories;

  return (
    <div className="relative pb-36">
      <div className="flex items-center gap-2 mb-4 -mt-1">
        <button
          type="button"
          onClick={handleBack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label={t('category.management.back')}
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {t('category.management.back')}
        </span>
      </div>

      {loadCategoryError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('category.loadError')}
        </div>
      )}

      {mainCategoryActionError && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t(`category.management.errors.${mainCategoryActionError}`)}
        </div>
      )}

      {isLoading ? (
        <p className="text-center py-12 text-slate-500 dark:text-slate-400">{t('category.management.loading')}</p>
      ) : (
        <CategoryManagementList
          locale={locale}
          mainCategories={mainCategories}
          onReorder={(orderedIds) => void reorderMainCategoriesAction(orderedIds)}
          onDelete={deleteMainCategoryAction}
          isDeleting={isBusy}
        />
      )}

      <ResetCategoriesConfirmModal
        open={showResetConfirm}
        isSaving={isResettingCategories}
        onConfirm={() => void handleResetConfirm()}
        onDismiss={() => setShowResetConfirm(false)}
      />

      <div className="fixed bottom-0 inset-x-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900 space-y-3">
        <button
          type="button"
          onClick={() => navigate(ROUTES.categoryCreate)}
          disabled={isBusy}
          className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-900 font-semibold shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {t('category.management.addButton')}
        </button>
        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          disabled={isBusy || isLoading}
          className="w-full min-h-[48px] rounded-xl text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-60"
        >
          {t('category.management.resetDefaults')}
        </button>
      </div>
    </div>
  );
}
