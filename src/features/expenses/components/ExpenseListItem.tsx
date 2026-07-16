import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { type ExpenseBatchMode } from '../hooks/useExpenseBatchMode';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { isBuiltinCategoryId, resolveCustomCategoryLabel } from '../../../domain/categories/resolveCategoryLabel';
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
  onItemClick: () => void;
}

export function ExpenseListItem({
  expense,
  locale,
  customCategories,
  mode,
  selected,
  showNestedDate = false,
  onItemClick,
}: ExpenseListItemProps) {
  const { t } = useTranslation();
  const { icon: Icon, color } = getCategoryUI(expense.category);
  const categoryLabel = isBuiltinCategoryId(expense.category)
    ? t(`category.${expense.category}`)
    : (resolveCustomCategoryLabel(expense.category, customCategories, locale) ?? t('category.other'));

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
        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{categoryLabel}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {resolveBilingualText(expense.description, locale)}
        </p>
        {showNestedDate && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {formatExpenseDateNumeric(expense.date, locale)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white ${color}`}>
          <Icon className="w-3 h-3" />
        </span>
        <span className="font-semibold text-rose-600 dark:text-rose-400">
          {formatCurrencyAmount(expense.amount, locale)}
        </span>
      </div>
    </button>
  );
}
