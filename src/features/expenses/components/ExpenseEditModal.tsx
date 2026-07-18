import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { type AppLocale } from '../../../config/app';
import { type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import { PAYMENT_METHOD_IDS } from '../../../domain/expenses/paymentMethods';
import {
  isRecurrenceActive,
  resolveRecurrenceLabelDescriptor,
} from '../../../domain/recurrence/resolveRecurrenceLabelKey';
import { type RecurrenceSelection } from '../../../types/recurrenceRule';
import { preventNumberInputScroll } from '../../../lib/input/preventNumberInputScroll';
import { formatExpenseDateNumeric } from '../../../lib/format/formatDate';
import { CustomDatePicker } from '../../../components/calendar';
import { ExpenseAttachmentField } from './ExpenseAttachmentField';
import { ExpenseRecurrencePickerModal } from './ExpenseRecurrencePickerModal';
import {
  mergeOccurrencesIntoSelection,
  RecurrenceOccurrencesLimitField,
} from './RecurrenceOccurrencesLimitField';

interface ExpenseEditModalProps {
  open: boolean;
  input: EditExpenseInput;
  categoryOptions: { id: string; label: string }[];
  recurrenceSelection: RecurrenceSelection;
  existingAttachmentUrl?: string;
  pendingAttachmentFile: File | null;
  removeAttachment: boolean;
  isSaving: boolean;
  errorKey: string | null;
  onChange: (input: EditExpenseInput) => void;
  onRecurrenceSelectionChange: (selection: RecurrenceSelection) => void;
  onAttachmentFileChange: (file: File | null) => void;
  onRemoveAttachment: () => void;
  onSave: () => void;
  onClose: () => void;
  hideDateField?: boolean;
  hideRecurrenceField?: boolean;
  dateLabelKey?: string;
  modalTitleKey?: string;
  occurrencesTitleKey?: string;
  occurrencesCustomLabelKey?: string;
  minCustomOccurrences?: number;
}

export function ExpenseEditModal({
  open,
  input,
  categoryOptions,
  recurrenceSelection,
  existingAttachmentUrl,
  pendingAttachmentFile,
  removeAttachment,
  isSaving,
  errorKey,
  onChange,
  onRecurrenceSelectionChange,
  onAttachmentFileChange,
  onRemoveAttachment,
  onSave,
  onClose,
  hideDateField = false,
  hideRecurrenceField = false,
  dateLabelKey = 'expense.dateLabel',
  modalTitleKey = 'expense.editModal.title',
  occurrencesTitleKey,
  occurrencesCustomLabelKey,
  minCustomOccurrences,
}: ExpenseEditModalProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const recurrenceDescriptor = resolveRecurrenceLabelDescriptor(recurrenceSelection);
  const recurrenceLabel = t(recurrenceDescriptor.key, recurrenceDescriptor.params);
  const recurrenceActive = isRecurrenceActive(recurrenceSelection);

  if (!open) return null;

  const resolveErrorMessage = (key: string) => {
    if (key === 'translationError') {
      return t('expense.validation.translationError');
    }
    if (key.startsWith('RECURRENCE_')) {
      return t(`addExpense.validation.${key}`);
    }
    return t(`expense.validation.${key}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {t(modalTitleKey)}
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
              {resolveErrorMessage(errorKey)}
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
            {!hideDateField && (
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                {t(dateLabelKey)}
              </label>
              <button
                type="button"
                onClick={() => setDateModalOpen(true)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-start min-h-[48px]"
              >
                {formatExpenseDateNumeric(input.date, locale)}
              </button>
            </div>
            )}
            {!hideRecurrenceField && (
            <>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                {t('addExpense.recurrence.selectRecurrence')}
              </label>
              <button
                type="button"
                onClick={() => setRecurrenceModalOpen(true)}
                className={`w-full min-h-[44px] px-4 py-3 rounded-xl border text-start ${
                  recurrenceActive
                    ? 'border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700'
                }`}
              >
                {recurrenceLabel}
              </button>
            </div>
            {recurrenceActive && (
              <RecurrenceOccurrencesLimitField
                variant="inline"
                occurrencesLimit={recurrenceSelection.occurrencesLimit ?? 'unlimited'}
                customOccurrences={recurrenceSelection.customOccurrences ?? 2}
                onOccurrencesLimitChange={(limit) =>
                  onRecurrenceSelectionChange(
                    mergeOccurrencesIntoSelection(
                      recurrenceSelection,
                      limit,
                      recurrenceSelection.customOccurrences ?? 2,
                    ),
                  )
                }
                onCustomOccurrencesChange={(count) =>
                  onRecurrenceSelectionChange(
                    mergeOccurrencesIntoSelection(recurrenceSelection, 'custom', count),
                  )
                }
                occurrencesTitleKey={occurrencesTitleKey}
                occurrencesCustomLabelKey={occurrencesCustomLabelKey}
                minCustomOccurrences={minCustomOccurrences}
              />
            )}
            </>
            )}
            <ExpenseAttachmentField
              existingAttachmentUrl={existingAttachmentUrl}
              pendingAttachmentFile={pendingAttachmentFile}
              removeAttachment={removeAttachment}
              onAttachmentFileChange={onAttachmentFileChange}
              onRemoveAttachment={() => {
                onAttachmentFileChange(null);
                onRemoveAttachment();
              }}
            />
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

      {!hideRecurrenceField && (
      <ExpenseRecurrencePickerModal
        open={recurrenceModalOpen}
        value={recurrenceSelection}
        onSelect={onRecurrenceSelectionChange}
        onClose={() => setRecurrenceModalOpen(false)}
        hideOccurrencesField
      />
      )}

      {!hideDateField && (
        <CustomDatePicker
          open={dateModalOpen}
          value={input.date}
          onConfirm={(isoDate) => {
            onChange({ ...input, date: isoDate });
            setDateModalOpen(false);
          }}
          onCancel={() => setDateModalOpen(false)}
        />
      )}
    </>
  );
}
