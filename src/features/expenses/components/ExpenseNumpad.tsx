import { useTranslation } from 'react-i18next';
import { Calendar, Check, Delete } from 'lucide-react';
import { type PaymentMethodId } from '../../../types/paymentMethod';
import {
  appendNumpadDigit,
  formatNumpadDisplay,
  numpadAmountToNumber,
  numpadBackspace,
} from '../../../domain/expenses/numpadAmount';
import { PaymentMethodIcon } from './PaymentMethodIcon';

interface ExpenseNumpadProps {
  amountDigits: string;
  onAmountChange: (value: string) => void;
  dateLabel: string;
  onDateClick: () => void;
  paymentMethodId: PaymentMethodId;
  paymentMethodLabel: string;
  onPaymentMethodClick: () => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function ExpenseNumpad({
  amountDigits,
  onAmountChange,
  dateLabel,
  onDateClick,
  paymentMethodId,
  paymentMethodLabel,
  onPaymentMethodClick,
  onSubmit,
  isSaving,
}: ExpenseNumpadProps) {
  const { t } = useTranslation();
  const canSubmit = numpadAmountToNumber(amountDigits) > 0 && !isSaving;

  const handleKey = (key: string) => {
    if (key === 'backspace') {
      onAmountChange(numpadBackspace(amountDigits));
      return;
    }
    onAmountChange(appendNumpadDigit(amountDigits, key));
  };

  const digitBtn =
    'min-h-[56px] rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95';

  const sideActionBtn =
    'rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex flex-col items-center justify-center gap-0.5 px-1 active:scale-95';

  return (
    <div className="grid grid-cols-4 gap-2">
      {['7', '8', '9'].map((d) => (
        <button key={d} type="button" className={digitBtn} onClick={() => handleKey(d)}>
          {d}
        </button>
      ))}
      <button
        type="button"
        onClick={onDateClick}
        className={`min-h-[56px] ${sideActionBtn}`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-[10px] font-medium leading-tight text-center">{dateLabel}</span>
      </button>

      {['4', '5', '6'].map((d) => (
        <button key={d} type="button" className={digitBtn} onClick={() => handleKey(d)}>
          {d}
        </button>
      ))}
      <button
        type="button"
        onClick={onPaymentMethodClick}
        aria-label={t('addExpense.selectPaymentMethod')}
        className={`row-span-2 min-h-0 ${sideActionBtn}`}
      >
        <PaymentMethodIcon methodId={paymentMethodId} className="w-5 h-5" />
        <span className="text-[10px] font-medium leading-tight text-center line-clamp-2">
          {paymentMethodLabel}
        </span>
      </button>

      {['1', '2', '3'].map((d) => (
        <button key={d} type="button" className={digitBtn} onClick={() => handleKey(d)}>
          {d}
        </button>
      ))}

      <button type="button" className={digitBtn} onClick={() => handleKey('.')}>
        .
      </button>
      <button type="button" className={digitBtn} onClick={() => handleKey('0')}>
        0
      </button>
      <button
        type="button"
        className={`${digitBtn} flex items-center justify-center`}
        onClick={() => handleKey('backspace')}
        aria-label={t('addExpense.backspace')}
      >
        <Delete className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        aria-label={t('addExpense.submit')}
        className="min-h-[56px] rounded-xl bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 flex items-center justify-center transition-colors active:scale-95"
      >
        {isSaving ? (
          <span className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Check className="w-7 h-7" strokeWidth={3} />
        )}
      </button>
    </div>
  );
}

export { formatNumpadDisplay };
