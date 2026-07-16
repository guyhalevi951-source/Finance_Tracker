import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { PAYMENT_METHOD_IDS, type PaymentMethodId } from '../../../domain/expenses/paymentMethods';
import { PaymentMethodIcon } from './PaymentMethodIcon';

interface ExpensePaymentMethodPickerModalProps {
  open: boolean;
  value: PaymentMethodId;
  onSelect: (methodId: PaymentMethodId) => void;
  onClose: () => void;
}

export function ExpensePaymentMethodPickerModal({
  open,
  value,
  onSelect,
  onClose,
}: ExpensePaymentMethodPickerModalProps) {
  const { t } = useTranslation();

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
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-payment-method-picker-title"
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="expense-payment-method-picker-title"
          className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4"
        >
          {t('addExpense.paymentMethodPickerTitle')}
        </h3>
        <ul className="space-y-2">
          {PAYMENT_METHOD_IDS.map((methodId) => {
            const isSelected = methodId === value;

            return (
              <li key={methodId}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(methodId);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl min-h-[48px] transition-colors ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <PaymentMethodIcon methodId={methodId} className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-start font-medium">
                    {t(`expense.paymentMethod.${methodId}`)}
                  </span>
                  {isSelected && <Check className="w-5 h-5 shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
