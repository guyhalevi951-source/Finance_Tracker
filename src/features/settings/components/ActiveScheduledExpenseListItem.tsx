import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type SubCategoryRecord } from '../../../types/category';
import { type AppLocale } from '../../../config/app';
import { resolveSubCategoryLabel } from '../../../domain/categories/resolveCategoryLabel';
import { resolveExpenseDisplayLabel } from '../../../domain/expenses/resolveExpenseDisplayLabel';
import { hasBilingualTextContent } from '../../../domain/i18n/buildBilingualText';
import { formatCurrencyAmount, formatExpenseDateNumeric } from '../../../lib/format/formatDate';

interface ActiveScheduledExpenseListItemProps {
  expense: Expense;
  locale: AppLocale;
  subCategories: SubCategoryRecord[];
  onEdit: () => void;
  onDelete: () => void;
}

export function ActiveScheduledExpenseListItem({
  expense,
  locale,
  subCategories,
  onEdit,
  onDelete,
}: ActiveScheduledExpenseListItemProps) {
  const { t } = useTranslation();

  const categoryLabel = resolveSubCategoryLabel(expense.category, subCategories, locale, t);
  const displayName = resolveExpenseDisplayLabel(expense, locale, categoryLabel);
  const hasDescription = hasBilingualTextContent(expense.description);

  return (
    <li className="flex items-center gap-3 px-4 py-4 min-h-[64px]">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
          {formatCurrencyAmount(expense.amount, locale)} ·{' '}
          {formatExpenseDateNumeric(expense.date, locale)}
        </p>
        {hasDescription && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {categoryLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('profile.settings.oneTime.editAction')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t('profile.settings.oneTime.deleteAction')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </li>
  );
}
