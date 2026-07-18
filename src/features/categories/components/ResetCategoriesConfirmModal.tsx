import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface ResetCategoriesConfirmModalProps {
  open: boolean;
  isSaving: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function ResetCategoriesConfirmModal({
  open,
  isSaving,
  onConfirm,
  onDismiss,
}: ResetCategoriesConfirmModalProps) {
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
            {t('category.management.resetConfirmTitle')}
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isSaving}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('category.management.resetConfirmCancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          {t('category.management.resetConfirmMessage')}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isSaving}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px]"
          >
            {t('category.management.resetConfirmCancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-medium min-h-[48px] disabled:opacity-60"
          >
            {t('category.management.resetConfirmConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
