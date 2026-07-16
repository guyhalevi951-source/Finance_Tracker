import { type AppLocale } from '../../../config/app';
import { type PaymentMethodId } from '../../../types/paymentMethod';
import { type RecurrenceSelection } from '../../../types/recurrenceRule';
import { type AddExpenseStep } from '../hooks/useAddExpenseFlow';
import { CategorySelectionStep } from './CategorySelectionStep';
import { ExpenseEntryStep } from './ExpenseEntryStep';

interface AddExpenseFlowModalProps {
  open: boolean;
  step: AddExpenseStep;
  locale: AppLocale;
  selectedSubCategoryId: string | null;
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
  onClose: () => void;
  onSelectSubCategory: (subId: string) => void;
  onBackToCategories: () => void;
  onSubmit: () => void;
}

export function AddExpenseFlowModal({
  open,
  step,
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
  onClose,
  onSelectSubCategory,
  onBackToCategories,
  onSubmit,
}: AddExpenseFlowModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
      {step === 'category' && (
        <CategorySelectionStep onCancel={onClose} onSelectSubCategory={onSelectSubCategory} />
      )}
      {step === 'entry' && selectedSubCategoryId && (
        <ExpenseEntryStep
          locale={locale}
          selectedSubCategoryId={selectedSubCategoryId}
          amountDigits={amountDigits}
          onAmountChange={onAmountChange}
          note={note}
          onNoteChange={onNoteChange}
          date={date}
          onDateChange={onDateChange}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={onPaymentMethodChange}
          recurrenceSelection={recurrenceSelection}
          onRecurrenceSelectionChange={onRecurrenceSelectionChange}
          attachmentFile={attachmentFile}
          onAttachmentChange={onAttachmentChange}
          isSaving={isSaving}
          errorKey={errorKey}
          onBack={onBackToCategories}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
