import { Result, ok, err } from '../../types/result';
import { isPaymentMethodId } from './paymentMethods';
import { isIsoDateString } from './parseExpenseDate';

export type ExpenseValidationError =
  | 'AMOUNT_INVALID'
  | 'AMOUNT_NOT_POSITIVE'
  | 'PAYMENT_METHOD_INVALID'
  | 'DATE_INVALID';

export interface NewExpenseInput {
  description: string;
  amount: string;
  category: string;
  paymentMethod: string;
  date: string;
}

export interface ValidatedExpenseInput {
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
}

export interface EditExpenseInput {
  description: string;
  amount: string;
  category: string;
  paymentMethod: string;
  date: string;
}

/**
 * Validate raw expense form input.
 * Returns typed, parsed fields on success, or a typed error on the first violation found.
 */
export function validateExpenseInput(
  input: NewExpenseInput | EditExpenseInput,
): Result<ValidatedExpenseInput, ExpenseValidationError> {
  const amount = parseFloat(input.amount);
  if (isNaN(amount)) return err('AMOUNT_INVALID');
  if (amount <= 0) return err('AMOUNT_NOT_POSITIVE');

  if (!isPaymentMethodId(input.paymentMethod)) return err('PAYMENT_METHOD_INVALID');
  if (!isIsoDateString(input.date)) return err('DATE_INVALID');

  return ok({
    description: input.description.trim(),
    amount,
    category: input.category,
    paymentMethod: input.paymentMethod,
    date: input.date,
  });
}
