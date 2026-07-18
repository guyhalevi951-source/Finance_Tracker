import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import {
  BUILTIN_PARENT_CATEGORY_IDS,
  getSubCategoriesForParent,
  getSubCategoryI18nKey,
  type BuiltinParentCategoryId,
} from '../../../domain/categories/hierarchy';
import { getBuiltinParentI18nKey } from '../../../domain/categories/resolveCategoryLabel';
import { getSubCategoryUI, PARENT_CATEGORY_UI } from '../categoryUi';
import { expenseCompactLabelClass } from './expenseCompactButtonStyles';

interface CategorySelectionStepProps {
  onCancel: () => void;
  onSelectSubCategory: (subId: string) => void;
}

interface CategoryGridItemProps {
  icon: LucideIcon;
  color: string;
  label: string;
  onClick: () => void;
}

function CategoryGridItem({ icon: Icon, color, label, onClick }: CategoryGridItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 min-h-[88px] group"
    >
      <span
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${color} group-hover:opacity-90 transition-opacity`}
      >
        <Icon className="w-6 h-6" />
      </span>
      <span className={`text-xs text-slate-700 dark:text-slate-300 w-full ${expenseCompactLabelClass}`}>
        {label}
      </span>
    </button>
  );
}

export function CategorySelectionStep({ onCancel, onSelectSubCategory }: CategorySelectionStepProps) {
  const { t } = useTranslation();
  const [selectedParentId, setSelectedParentId] = useState<BuiltinParentCategoryId | null>(null);

  const isSubView = selectedParentId !== null;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        {isSubView ? (
          <button
            type="button"
            onClick={() => setSelectedParentId(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
            aria-label={t('addExpense.back')}
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="text-rose-600 dark:text-rose-400 font-medium min-h-[44px] px-2"
          >
            {t('addExpense.cancel')}
          </button>
        )}
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate px-2">
          {isSubView && selectedParentId
            ? t(getBuiltinParentI18nKey(selectedParentId))
            : t('addExpense.title')}
        </h1>
        {isSubView ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-rose-600 dark:text-rose-400 font-medium min-h-[44px] px-2"
          >
            {t('addExpense.cancel')}
          </button>
        ) : (
          <span className="w-16" aria-hidden />
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!isSubView ? (
          <div className="grid grid-cols-4 gap-x-2 gap-y-6">
            {BUILTIN_PARENT_CATEGORY_IDS.map((parentId) => {
              const { icon: Icon, color } = PARENT_CATEGORY_UI[parentId];
              return (
                <CategoryGridItem
                  key={parentId}
                  icon={Icon}
                  color={color}
                  label={t(getBuiltinParentI18nKey(parentId))}
                  onClick={() => setSelectedParentId(parentId)}
                />
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-x-2 gap-y-6">
            {getSubCategoriesForParent(selectedParentId).map((subId) => {
              const { icon: Icon, color } = getSubCategoryUI(subId);
              return (
                <CategoryGridItem
                  key={subId}
                  icon={Icon}
                  color={color}
                  label={t(getSubCategoryI18nKey(subId))}
                  onClick={() => onSelectSubCategory(subId)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
