import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ExpenseDatePickerModalProps {
  open: boolean;
  value: string;
  onConfirm: (isoDate: string) => void;
  onCancel: () => void;
}

export function ExpenseDatePickerModal({
  open,
  value,
  onConfirm,
  onCancel,
}: ExpenseDatePickerModalProps) {
  const { t } = useTranslation();
  const [draftDate, setDraftDate] = useState(value);

  useEffect(() => {
    if (open) setDraftDate(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      role="presentation"
      aria-hidden={false}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-date-picker-title"
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="expense-date-picker-title"
          className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4"
        >
          {t('addExpense.datePickerTitle')}
        </h3>
        <input
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 mb-6 min-h-[48px]"
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px]"
          >
            {t('addExpense.dateCancel')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(draftDate)}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium min-h-[48px]"
          >
            {t('addExpense.dateConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
