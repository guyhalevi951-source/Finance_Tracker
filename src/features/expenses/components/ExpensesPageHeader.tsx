import { useTranslation } from 'react-i18next';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { type ExpenseBatchMode } from '../hooks/useExpenseBatchMode';
import { BatchCancelButton } from './DiscardChangesModal';

interface ExpensesPageHeaderProps {
  mode: ExpenseBatchMode;
  isSaving: boolean;
  onEnterDelete: () => void;
  onEnterEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExpensesPageHeader({
  mode,
  isSaving,
  onEnterDelete,
  onEnterEdit,
  onConfirm,
  onCancel,
}: ExpensesPageHeaderProps) {
  const { t } = useTranslation();
  const inBatchMode = mode !== 'view';

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="min-w-[120px]">
        {inBatchMode && <BatchCancelButton onClick={onCancel} />}
      </div>

      <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
        {t('expense.pageTitle')}
      </h1>

      <div className="flex items-center gap-2 min-w-[120px] justify-end">
        {mode === 'view' && (
          <>
            <button
              onClick={onEnterDelete}
              aria-label={t('expense.batch.deleteMode')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-rose-400 hover:text-rose-600"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onEnterEdit}
              aria-label={t('expense.batch.editMode')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </>
        )}
        {inBatchMode && (
          <button
            onClick={onConfirm}
            disabled={isSaving}
            aria-label={t('expense.batch.confirm')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <Check className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
