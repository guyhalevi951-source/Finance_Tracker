import { Result, err, ok } from '../../types/result';
import { type SubBudgetInput } from '../../types/budget';

export type SubBudgetValidationError =
  | 'NAME_REQUIRED'
  | 'AMOUNT_INVALID'
  | 'DATE_REQUIRED'
  | 'END_BEFORE_START'
  | 'END_IN_PAST'
  | 'DATE_OUT_OF_WINDOW';

export interface SubBudgetFormInput {
  name: string;
  totalAmount: string;
  startDate: string;
  endDate: string;
  /** Checked = fixed (open-ended) budget; dates are ignored. */
  noTimeLimit: boolean;
  includeInMonthlyBudget: boolean;
}

export function parseSubBudgetInput(
  input: SubBudgetFormInput,
  todayIso: string,
): Result<SubBudgetInput, SubBudgetValidationError> {
  if (input.name.trim() === '') {
    return err('NAME_REQUIRED');
  }

  const trimmedAmount = input.totalAmount.trim();
  let totalAmount: number | null = null;
  if (trimmedAmount !== '') {
    const parsedAmount = parseFloat(trimmedAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return err('AMOUNT_INVALID');
    }
    totalAmount = parsedAmount;
  }

  const name = { en: input.name.trim(), he: input.name.trim() };

  if (input.noTimeLimit) {
    return ok({
      kind: 'fixed',
      name,
      totalAmount,
      includeInMonthlyBudget: input.includeInMonthlyBudget,
    });
  }

  if (!input.startDate || !input.endDate) {
    return err('DATE_REQUIRED');
  }

  if (input.endDate < input.startDate) {
    return err('END_BEFORE_START');
  }

  if (input.endDate < todayIso) {
    return err('END_IN_PAST');
  }

  return ok({
    kind: 'temporary',
    name,
    totalAmount,
    includeInMonthlyBudget: input.includeInMonthlyBudget,
    startDate: input.startDate,
    endDate: input.endDate,
  });
}

export function isDateWithinSubBudget(
  dateIso: string,
  startDate: string,
  endDate: string,
): boolean {
  return dateIso >= startDate && dateIso <= endDate;
}
