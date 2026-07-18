import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type SubCategoryRecord } from '../../../types/category';
import { resolveSubCategoryLabel } from '../../../domain/categories/resolveCategoryLabel';
import { resolveExpenseDisplayLabel } from '../../../domain/expenses/resolveExpenseDisplayLabel';
import { formatCurrencyAmount, formatExpenseDateLong } from '../../../lib/format/formatDate';
import { type AppLocale } from '../../../config/app';

interface RecurringDeleteConfirmModalProps {
  open: boolean;
  target: Expense | null;
  expenses: Expense[];
  todayIso: string;
  subCategories: SubCategoryRecord[];
  locale: AppLocale;
  queueIndex: number;
  queueTotal: number;
  isSaving: boolean;
  onConfirm: (scope: RecurrenceDeleteScope) => void;
  onDismiss: () => void;
}

export function RecurringDeleteConfirmModal({
  open,
  target,
  expenses,
  todayIso,
  subCategories,
  locale,
  queueIndex,
  queueTotal,
  isSaving,
  onConfirm,
  onDismiss,
}: RecurringDeleteConfirmModalProps) {
  const { t } = useTranslation();

  const futureOccurrenceCount = useMemo(() => {
    if (!target) return 0;
    const total = countThisAndFutureDeleteOccurrences(expenses, target, todayIso);
    return Math.max(0, total - 1);
  }, [expenses, target, todayIso]);

  if (!open || !target) return null;

  const categoryLabel = resolveSubCategoryLabel(target.category, subCategories, locale, t);
  const displayName = resolveExpenseDisplayLabel(target, locale, categoryLabel);

  const thisAndFutureLabel =
    futureOccurrenceCount === 1
      ? t('expense.batch.recurringDeleteThisAndFutureWithCount_one', { count: futureOccurrenceCount })
      : t('expense.batch.recurringDeleteThisAndFutureWithCount', { count: futureOccurrenceCount });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('expense.batch.recurringDeleteTitle')}
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

        {queueTotal > 1 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {t('expense.batch.recurringDeleteProgress', {
              current: queueIndex,
              total: queueTotal,
            })}
          </p>
        )}

        <p className="text-slate-600 dark:text-slate-300 mb-4">
          {t('expense.batch.recurringDeleteMessage')}
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
              {formatCurrencyAmount(target.amount, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('expense.dateLabel')}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {formatExpenseDateLong(target.date, locale)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onConfirm('instanceOnly')}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px] disabled:opacity-60"
          >
            {t('expense.batch.recurringDeleteInstanceOnly')}
          </button>
          {futureOccurrenceCount > 0 && (
          <button
            type="button"
            onClick={() => onConfirm('thisAndFuture')}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium min-h-[48px] disabled:opacity-60 whitespace-normal"
          >
            {thisAndFutureLabel}
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
