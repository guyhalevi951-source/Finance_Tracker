import { useTranslation } from 'react-i18next';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { type ExpenseBatchMode } from '../hooks/useExpenseBatchMode';
import { BatchCancelButton } from './DiscardChangesModal';

interface ExpensesHeaderActionsProps {
  mode: ExpenseBatchMode;
  isSaving: boolean;
  onEnterDelete: () => void;
  onEnterEdit: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ExpensesHeaderActions({
  mode,
  isSaving,
  onEnterDelete,
  onEnterEdit,
  onConfirm,
  onCancel,
}: ExpensesHeaderActionsProps) {
  const { t } = useTranslation();
  const inBatchMode = mode !== 'view';

  if (inBatchMode) {
    return (
      <div className="flex items-center gap-2">
        <BatchCancelButton onClick={onCancel} />
        <button
          onClick={onConfirm}
          disabled={isSaving}
          aria-label={t('expense.batch.confirm')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
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
    </div>
  );
}
