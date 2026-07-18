import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Camera } from 'lucide-react';
import { getSubCategoryI18nKey } from '../../../domain/categories/hierarchy';
import { toIsoDate } from '../../../domain/expenses/parseExpenseDate';
import { formatExpenseDateNumeric } from '../../../lib/format/formatDate';
import { type AppLocale } from '../../../config/app';
import { type PaymentMethodId } from '../../../types/paymentMethod';
import {
  type RecurrenceSelection,
} from '../../../types/recurrenceRule';
import {
  isRecurrenceActive,
  resolveRecurrenceLabelDescriptor,
} from '../../../domain/recurrence/resolveRecurrenceLabelKey';
import { resolveOccurrencesLimitLabelDescriptor } from '../../../domain/recurrence/resolveOccurrencesLimitLabelKey';
import { ExpenseNumpad, formatNumpadDisplay } from './ExpenseNumpad';
import { CustomDatePicker } from '../../../components/calendar';
import { ExpensePaymentMethodPickerModal } from './ExpensePaymentMethodPickerModal';
import { ExpenseRecurrencePickerModal } from './ExpenseRecurrencePickerModal';

interface ExpenseEntryStepProps {
  locale: AppLocale;
  selectedSubCategoryId: string;
  amountDigits: string;
  onAmountChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  date: string;
  onDateChange: (value: string) => void;
  paymentMethod: PaymentMethodId;
  onPaymentMethodChange: (value: PaymentMethodId) => void;
  recurrenceSelection: RecurrenceSelection;
  onRecurrenceSelectionChange: (value: RecurrenceSelection) => void;
  attachmentFile: File | null;
  onAttachmentChange: (file: File | null) => void;
  isSaving: boolean;
  errorKey: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

export function ExpenseEntryStep({
  locale,
  selectedSubCategoryId,
  amountDigits,
  onAmountChange,
  note,
  onNoteChange,
  date,
  onDateChange,
  paymentMethod,
  onPaymentMethodChange,
  recurrenceSelection,
  onRecurrenceSelectionChange,
  attachmentFile,
  onAttachmentChange,
  isSaving,
  errorKey,
  onBack,
  onSubmit,
}: ExpenseEntryStepProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [recurrenceModalOpen, setRecurrenceModalOpen] = useState(false);

  const todayIso = toIsoDate(new Date());
  const dateLabel = date === todayIso ? t('addExpense.today') : formatExpenseDateNumeric(date, locale);
  const paymentMethodLabel = t(`expense.paymentMethod.${paymentMethod}`);
  const recurrenceDescriptor = resolveRecurrenceLabelDescriptor(recurrenceSelection);
  const recurrenceLabel = t(recurrenceDescriptor.key, recurrenceDescriptor.params);
  const recurrenceActive = isRecurrenceActive(recurrenceSelection);
  const occurrencesDescriptor = resolveOccurrencesLimitLabelDescriptor(recurrenceSelection);
  const recurrenceOccurrencesLabel = occurrencesDescriptor
    ? occurrencesDescriptor.literal ??
      t(occurrencesDescriptor.key, occurrencesDescriptor.params)
    : null;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
          aria-label={t('addExpense.back')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate flex-1">
          {t(getSubCategoryI18nKey(selectedSubCategoryId))}
        </p>
        <p className="text-4xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
          {formatNumpadDisplay(amountDigits)}
        </p>
      </header>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4 overflow-y-auto">
        {errorKey && (
          <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-3">
            {t(errorKey)}
          </p>
        )}

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3">
          <label className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
            {t('addExpense.noteLabel')}:
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={t('addExpense.notePlaceholder')}
            className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 outline-none text-sm min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0"
            aria-label={t('addExpense.attachImage')}
          >
            <Camera className="w-5 h-5" />
            {attachmentFile && (
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center">
                1
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onAttachmentChange(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="mt-auto">
          <ExpenseNumpad
            amountDigits={amountDigits}
            onAmountChange={onAmountChange}
            dateLabel={dateLabel}
            onDateClick={() => setDateModalOpen(true)}
            paymentMethodId={paymentMethod}
            paymentMethodLabel={paymentMethodLabel}
            onPaymentMethodClick={() => setPaymentMethodModalOpen(true)}
            recurrenceLabel={recurrenceLabel}
            recurrenceOccurrencesLabel={recurrenceOccurrencesLabel}
            recurrenceActive={recurrenceActive}
            onRecurrenceClick={() => setRecurrenceModalOpen(true)}
            onSubmit={onSubmit}
            isSaving={isSaving}
          />
        </div>
      </div>

      <CustomDatePicker
        open={dateModalOpen}
        value={date}
        onConfirm={(isoDate) => {
          onDateChange(isoDate);
          setDateModalOpen(false);
        }}
        onCancel={() => setDateModalOpen(false)}
      />

      <ExpensePaymentMethodPickerModal
        open={paymentMethodModalOpen}
        value={paymentMethod}
        onSelect={onPaymentMethodChange}
        onClose={() => setPaymentMethodModalOpen(false)}
      />

      <ExpenseRecurrencePickerModal
        open={recurrenceModalOpen}
        value={recurrenceSelection}
        onSelect={onRecurrenceSelectionChange}
        onClose={() => setRecurrenceModalOpen(false)}
      />
    </div>
  );
}
