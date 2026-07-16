import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type ExpenseBatchMode } from '../hooks/useExpenseBatchMode';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { hasBilingualTextContent } from '../../../domain/i18n/buildBilingualText';
import { isBuiltinSubCategoryId } from '../../../domain/categories/hierarchy';
import { getBuiltinCategoryI18nKey, resolveCustomCategoryLabel } from '../../../domain/categories/resolveCategoryLabel';
import { type CustomCategory } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { formatCurrencyAmount, formatExpenseDateNumeric } from '../../../lib/format/formatDate';
import { getCategoryUI } from '../categoryUi';

interface ExpenseListItemProps {
  expense: Expense;
  locale: AppLocale;
  customCategories: CustomCategory[];
  mode: ExpenseBatchMode;
  selected: boolean;
  showNestedDate?: boolean;
  hideCategoryLabel?: boolean;
  onItemClick: () => void;
}

export function ExpenseListItem({
  expense,
  locale,
  customCategories,
  mode,
  selected,
  showNestedDate = false,
  hideCategoryLabel = false,
  onItemClick,
}: ExpenseListItemProps) {
  const { t } = useTranslation();
  const { icon: Icon, color } = getCategoryUI(expense.category);
  const categoryLabel = isBuiltinSubCategoryId(expense.category)
    ? t(getBuiltinCategoryI18nKey(expense.category))
    : (resolveCustomCategoryLabel(expense.category, customCategories, locale) ?? t('category.sub.other.miscellaneous'));
  const descriptionText = resolveBilingualText(expense.description, locale);
  const hasDescription = hasBilingualTextContent(expense.description);

  return (
    <button
      type="button"
      onClick={onItemClick}
      className={`w-full flex items-center gap-3 px-4 py-4 text-start transition-colors min-h-[56px] ${
        mode === 'deleting' && selected
          ? 'bg-rose-50 dark:bg-rose-900/20'
          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
    >
      {mode === 'deleting' && (
        <span
          className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
            selected
              ? 'bg-rose-600 border-rose-600 text-white'
              : 'border-slate-300 dark:border-slate-500'
          }`}
          aria-hidden
        >
          {selected && '✓'}
        </span>
      )}

      <div className="flex-1 min-w-0">
        {hideCategoryLabel ? (
          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
            {hasDescription ? descriptionText : categoryLabel}
          </p>
        ) : (
          <>
            <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{categoryLabel}</p>
            {hasDescription && (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {descriptionText}
              </p>
            )}
          </>
        )}
        {showNestedDate && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {formatExpenseDateNumeric(expense.date, locale)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-semibold text-rose-600 dark:text-rose-400">
          {formatCurrencyAmount(expense.amount, locale)}
        </span>
        <div className="relative flex-shrink-0">
          <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white ${color}`}>
            <Icon className="w-4 h-4" />
          </span>
          {expense.attachmentUrl && (
            <span
              className="absolute -bottom-0.5 -start-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-800"
              aria-hidden
            >
              <Camera className="w-2.5 h-2.5 text-slate-800" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
