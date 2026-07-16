import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import { PAYMENT_METHOD_IDS } from '../../../domain/expenses/paymentMethods';
import { preventNumberInputScroll } from '../../../lib/input/preventNumberInputScroll';

interface ExpenseEditModalProps {
  open: boolean;
  input: EditExpenseInput;
  categoryOptions: { id: string; label: string }[];
  isSaving: boolean;
  errorKey: string | null;
  onChange: (input: EditExpenseInput) => void;
  onSave: () => void;
  onClose: () => void;
}

export function ExpenseEditModal({
  open,
  input,
  categoryOptions,
  isSaving,
  errorKey,
  onChange,
  onSave,
  onClose,
}: ExpenseEditModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('expense.editModal.title')}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('expense.editModal.cancel')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorKey && (
          <div className="mb-4 text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl px-4 py-3">
            {errorKey === 'translationError'
              ? t('expense.validation.translationError')
              : t(`expense.validation.${errorKey}`)}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.descriptionLabel')}
            </label>
            <input
              type="text"
              value={input.description}
              onChange={(e) => onChange({ ...input, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.amountLabel')}
            </label>
            <input
              type="number"
              value={input.amount}
              onChange={(e) => onChange({ ...input, amount: e.target.value })}
              onWheel={preventNumberInputScroll}
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.categoryLabel')}
            </label>
            <select
              value={input.category}
              onChange={(e) => onChange({ ...input, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              {categoryOptions.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.paymentMethodLabel')}
            </label>
            <select
              value={input.paymentMethod}
              onChange={(e) => onChange({ ...input, paymentMethod: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              {PAYMENT_METHOD_IDS.map((id) => (
                <option key={id} value={id}>{t(`expense.paymentMethod.${id}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.dateLabel')}
            </label>
            <input
              type="date"
              value={input.date}
              onChange={(e) => onChange({ ...input, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 min-h-[48px]"
          >
            {t('expense.editModal.cancel')}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium min-h-[48px] disabled:opacity-60"
          >
            {isSaving ? t('expense.editModal.saving') : t('expense.editModal.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
