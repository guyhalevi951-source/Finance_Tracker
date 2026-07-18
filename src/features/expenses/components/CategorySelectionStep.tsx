import { useTranslation } from 'react-i18next';
import {
  BUILTIN_PARENT_CATEGORY_IDS,
  getSubCategoriesForParent,
  getSubCategoryI18nKey,
} from '../../../domain/categories/hierarchy';
import { getBuiltinParentI18nKey } from '../../../domain/categories/resolveCategoryLabel';
import { getCategoryUI } from '../categoryUi';
import { expenseCompactLabelClass } from './expenseCompactButtonStyles';

interface CategorySelectionStepProps {
  onCancel: () => void;
  onSelectSubCategory: (subId: string) => void;
}

export function CategorySelectionStep({ onCancel, onSelectSubCategory }: CategorySelectionStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="text-rose-600 dark:text-rose-400 font-medium min-h-[44px] px-2"
        >
          {t('addExpense.cancel')}
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t('addExpense.title')}
        </h1>
        <span className="w-16" aria-hidden />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {BUILTIN_PARENT_CATEGORY_IDS.map((parentId) => (
          <section
            key={parentId}
            className="mb-8 last:mb-0 pb-8 last:pb-0 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
          >
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
              {t(getBuiltinParentI18nKey(parentId))}
            </h2>
            <div className="grid grid-cols-4 gap-x-2 gap-y-6">
              {getSubCategoriesForParent(parentId).map((subId) => {
                const { icon: Icon, color } = getCategoryUI(subId);
                return (
                  <button
                    key={subId}
                    type="button"
                    onClick={() => onSelectSubCategory(subId)}
                    className="flex flex-col items-center gap-2 min-h-[88px] group"
                  >
                    <span
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${color} group-hover:opacity-90 transition-opacity`}
                    >
                      <Icon className="w-6 h-6" />
                    </span>
                    <span className={`text-xs text-slate-700 dark:text-slate-300 w-full ${expenseCompactLabelClass}`}>
                      {t(getSubCategoryI18nKey(subId))}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
