import { MASTER_BUDGET_ID } from '../domain/budget/constants';

/** Budget profile key: master ledger or a sub-budget id */
export type BudgetProfileId = typeof MASTER_BUDGET_ID | string;

export function isBudgetProfileId(value: string): value is BudgetProfileId {
  return value.length > 0;
}
