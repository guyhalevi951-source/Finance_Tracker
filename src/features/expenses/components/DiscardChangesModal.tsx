import { useTranslation } from 'react-i18next';
import { ArrowLeft, X } from 'lucide-react';

interface DiscardChangesModalProps {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function DiscardChangesModal({ open, onConfirm, onDismiss }: DiscardChangesModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('expense.batch.discardTitle')}
          </h3>
          <button
            onClick={onDismiss}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('expense.batch.discardNo')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{t('expense.batch.discardMessage')}</p>
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px]"
          >
            {t('expense.batch.discardNo')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-medium min-h-[48px]"
          >
            {t('expense.batch.discardYes')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BatchCancelButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 min-h-[44px] px-2"
      aria-label={t('expense.batch.cancel')}
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="text-sm font-medium">{t('expense.batch.cancel')}</span>
    </button>
  );
}
