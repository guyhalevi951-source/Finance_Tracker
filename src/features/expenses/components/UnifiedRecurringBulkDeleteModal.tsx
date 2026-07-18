import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { type CustomCategory } from '../../../types/category';
import { type BulkSeriesDeleteScope } from '../../../domain/recurrence/applyBulkSeriesDelete';
import { type SeriesExpenseGroup } from '../../../domain/recurrence/groupExpensesBySeriesRootId';
import { isBuiltinSubCategoryId } from '../../../domain/categories/hierarchy';
import {
  getBuiltinCategoryI18nKey,
  resolveCustomCategoryLabel,
} from '../../../domain/categories/resolveCategoryLabel';
import { resolveExpenseDisplayLabel } from '../../../domain/expenses/resolveExpenseDisplayLabel';
import { formatCurrencyAmount, formatExpenseDateLong } from '../../../lib/format/formatDate';
import { type AppLocale } from '../../../config/app';

interface UnifiedRecurringBulkDeleteModalProps {
  open: boolean;
  group: SeriesExpenseGroup | null;
  customCategories: CustomCategory[];
  locale: AppLocale;
  isSaving: boolean;
  onConfirm: (scope: BulkSeriesDeleteScope) => void;
  onDismiss: () => void;
}

export function UnifiedRecurringBulkDeleteModal({
  open,
  group,
  customCategories,
  locale,
  isSaving,
  onConfirm,
  onDismiss,
}: UnifiedRecurringBulkDeleteModalProps) {
  const { t } = useTranslation();

  const representative = useMemo(() => {
    if (!group || group.expenses.length === 0) return null;
    return [...group.expenses].sort((a, b) => a.date.localeCompare(b.date))[0];
  }, [group]);

  const selectedCount = group?.expenses.length ?? 0;

  if (!open || !group || !representative) return null;

  const categoryLabel = isBuiltinSubCategoryId(representative.category)
    ? t(getBuiltinCategoryI18nKey(representative.category))
    : (resolveCustomCategoryLabel(representative.category, customCategories, locale) ??
      t('category.sub.other.miscellaneous'));
  const displayName = resolveExpenseDisplayLabel(representative, locale, categoryLabel);

  const dateRangeLabel =
    selectedCount === 1
      ? formatExpenseDateLong(representative.date, locale)
      : t('expense.batch.unifiedBulkDeleteDateRange', {
          from: formatExpenseDateLong(
            [...group.expenses].sort((a, b) => a.date.localeCompare(b.date))[0].date,
            locale,
          ),
          to: formatExpenseDateLong(
            [...group.expenses].sort((a, b) => b.date.localeCompare(a.date))[0].date,
            locale,
          ),
        });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('expense.batch.unifiedBulkDeleteTitle')}
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isSaving}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-60"
            aria-label={t('addExpense.recurrence.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-300 mb-4">
          {t('expense.batch.unifiedBulkDeleteMessage', { count: selectedCount })}
        </p>

        <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-4 mb-6 space-y-2">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('expense.batch.recurringDeleteExpenseName')}
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('expense.batch.recurringDeleteAmount')}
            </p>
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {formatCurrencyAmount(representative.amount, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('expense.batch.unifiedBulkDeleteSelectedDates')}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">{dateRangeLabel}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onConfirm('selectedOnly')}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px] disabled:opacity-60 whitespace-normal text-start"
          >
            {t('expense.batch.unifiedBulkDeleteSelectedOnly')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm('selectedPlusFutureFromLatest')}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 min-h-[48px] disabled:opacity-60 whitespace-normal text-start"
          >
            {t('expense.batch.unifiedBulkDeleteSelectedPlusFuture')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm('fromEarliestSelected')}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium min-h-[48px] disabled:opacity-60 whitespace-normal text-start"
          >
            {t('expense.batch.unifiedBulkDeleteFromEarliest')}
          </button>
        </div>
      </div>
    </div>
  );
}
