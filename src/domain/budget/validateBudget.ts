import { Result, ok, err } from '../../types/result';

export type BudgetValidationError = 'EMPTY' | 'NOT_A_NUMBER' | 'NEGATIVE';

/**
 * Parse and validate a raw budget input string from the user.
 * Returns the valid non-negative number, or a typed error.
 */
export function parseBudgetInput(raw: string): Result<number, BudgetValidationError> {
  if (raw.trim() === '') return err('EMPTY');
  const amount = parseFloat(raw);
  if (isNaN(amount)) return err('NOT_A_NUMBER');
  if (amount < 0) return err('NEGATIVE');
  return ok(amount);
}
