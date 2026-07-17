import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { type Expense } from '../../../types/expense';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { hasBilingualTextContent } from '../../../domain/i18n/buildBilingualText';
import { type AppLocale } from '../../../config/app';

interface TerminateRecurrenceConfirmModalProps {
  open: boolean;
  target: Expense | null;
  locale: AppLocale;
  isSaving: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function TerminateRecurrenceConfirmModal({
  open,
  target,
  locale,
  isSaving,
  onConfirm,
  onDismiss,
}: TerminateRecurrenceConfirmModalProps) {
  const { t } = useTranslation();

  if (!open || !target) return null;

  const descriptionText = resolveBilingualText(target.description, locale);
  const hasDescription = hasBilingualTextContent(target.description);
  const label = hasDescription ? descriptionText : t('profile.settings.recurring.unnamed');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl"
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('profile.settings.recurring.terminateTitle')}
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            disabled={isSaving}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-60"
            aria-label={t('profile.settings.recurring.terminateCancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-600 dark:text-slate-300 mb-2">
          {t('profile.settings.recurring.terminateMessage')}
        </p>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-6 truncate">
          {label}
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px] disabled:opacity-60"
          >
            {t('profile.settings.recurring.terminateCancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium min-h-[48px] disabled:opacity-60"
          >
            {t('profile.settings.recurring.terminateConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
