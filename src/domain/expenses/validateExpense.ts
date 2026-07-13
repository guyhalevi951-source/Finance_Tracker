import { Result, ok, err } from '../../types/result';

export type ExpenseValidationError =
  | 'DESCRIPTION_EMPTY'
  | 'AMOUNT_INVALID'
  | 'AMOUNT_NOT_POSITIVE';

export interface NewExpenseInput {
  description: string;
  amount: string;
  category: string;
}

export interface ValidatedExpenseInput {
  description: string;
  amount: number;
  category: string;
}

/**
 * Validate raw expense form input.
 * Returns typed, parsed fields on success, or a typed error on the first violation found.
 */
export function validateExpenseInput(
  input: NewExpenseInput,
): Result<ValidatedExpenseInput, ExpenseValidationError> {
  if (input.description.trim() === '') return err('DESCRIPTION_EMPTY');

  const amount = parseFloat(input.amount);
  if (isNaN(amount)) return err('AMOUNT_INVALID');
  if (amount <= 0) return err('AMOUNT_NOT_POSITIVE');

  return ok({
    description: input.description.trim(),
    amount,
    category: input.category,
  });
}
