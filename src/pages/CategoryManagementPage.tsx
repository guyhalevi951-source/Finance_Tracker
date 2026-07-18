import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { CategoryManagementList } from '../features/categories/components/CategoryManagementList';
import { ROUTES } from '../config/routes';
import { type AppLocale } from '../config/app';

export function CategoryManagementPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const { userId } = useAuthSession();
  const {
    mainCategories,
    isLoading,
    loadCategoryError,
    mainCategoryActionError,
    deleteMainCategoryAction,
    reorderMainCategoriesAction,
    isSavingMainCategory,
  } = useCategories(userId);

  useAppHeader({ title: t('category.management.title') });

  return (
    <div className="relative pb-28">
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
          isDeleting={isSavingMainCategory}
        />
      )}

      <div className="fixed bottom-0 inset-x-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white dark:from-slate-900 dark:via-slate-900">
        <button
          type="button"
          onClick={() => navigate(ROUTES.categoryCreate)}
          className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {t('category.management.addButton')}
        </button>
      </div>
    </div>
  );
}
