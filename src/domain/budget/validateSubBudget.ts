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
}

export function parseSubBudgetInput(
  input: SubBudgetFormInput,
  todayIso: string,
): Result<SubBudgetInput, SubBudgetValidationError> {
  if (input.name.trim() === '') {
    return err('NAME_REQUIRED');
  }

  const totalAmount = parseFloat(input.totalAmount);
  if (isNaN(totalAmount) || totalAmount < 0) {
    return err('AMOUNT_INVALID');
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
    name: { en: input.name.trim(), he: input.name.trim() },
    totalAmount,
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
