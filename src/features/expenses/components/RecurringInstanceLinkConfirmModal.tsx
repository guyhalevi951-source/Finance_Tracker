import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export type RecurringInstanceLinkChoice = 'connected' | 'detached';

interface RecurringInstanceLinkConfirmModalProps {
  open: boolean;
  isSaving: boolean;
  onConfirm: (choice: RecurringInstanceLinkChoice) => void;
  onDismiss: () => void;
}

export function RecurringInstanceLinkConfirmModal({
  open,
  isSaving,
  onConfirm,
  onDismiss,
}: RecurringInstanceLinkConfirmModalProps) {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = (choice: RecurringInstanceLinkChoice) => {
    setSubmitted(true);
    onConfirm(choice);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurring-instance-link-title"
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between mb-2">
          <h3
            id="recurring-instance-link-title"
            className="text-lg font-semibold text-slate-800 dark:text-slate-100"
          >
            {t('expense.batch.recurringInstanceLinkTitle')}
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isSaving && submitted}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-60"
            aria-label={t('addExpense.recurrence.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-300 mb-6 whitespace-normal">
          {t('expense.batch.recurringInstanceLinkMessage')}
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleConfirm('connected')}
            disabled={submitted}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px] disabled:opacity-60 whitespace-normal"
          >
            {t('expense.batch.recurringInstanceLinkKeepConnected')}
          </button>
          <button
            type="button"
            onClick={() => handleConfirm('detached')}
            disabled={submitted}
            className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium min-h-[48px] disabled:opacity-60 whitespace-normal"
          >
            {t('expense.batch.recurringInstanceLinkDisconnect')}
          </button>
        </div>
      </div>
    </div>
  );
}
