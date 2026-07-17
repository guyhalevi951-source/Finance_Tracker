import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { type RecurrenceDeleteScope } from '../../../domain/recurrence/applyRecurrenceDelete';
import { formatExpenseDateLong } from '../../../lib/format/formatDate';
import { type AppLocale } from '../../../config/app';

interface RecurringDeleteConfirmModalProps {
  open: boolean;
  target: Expense | null;
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
  locale,
  queueIndex,
  queueTotal,
  isSaving,
  onConfirm,
  onDismiss,
}: RecurringDeleteConfirmModalProps) {
  const { t } = useTranslation();

  if (!open || !target) return null;

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

        <p className="text-slate-600 dark:text-slate-300 mb-2">
          {t('expense.batch.recurringDeleteMessage')}
        </p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-6">
          {formatExpenseDateLong(target.date, locale)}
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onConfirm('instanceOnly')}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px] disabled:opacity-60"
          >
            {t('expense.batch.recurringDeleteInstanceOnly')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm('thisAndFuture')}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium min-h-[48px] disabled:opacity-60"
          >
            {t('expense.batch.recurringDeleteThisAndFuture')}
          </button>
        </div>
      </div>
    </div>
  );
}
