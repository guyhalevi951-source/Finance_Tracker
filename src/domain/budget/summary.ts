import { sumAmounts, subtractAmounts } from '../money/arithmetic';
import { hasBudgetLimit } from './hasBudgetLimit';

export interface BudgetSummary {
  totalExpenses: number;
  budgetPercentage: number;
  isOverBudget: boolean;
  remaining: number;
}

/**
 * Derive all budget summary values from the authoritative budget and expense amounts.
 * All arithmetic uses precision-safe minor-unit operations (no raw float addition).
 */
export function computeBudgetSummary(
  budget: number | null,
  expenseAmounts: number[],
): BudgetSummary {
  const totalExpenses = sumAmounts(expenseAmounts);
  const budgetPercentage = hasBudgetLimit(budget) ? (totalExpenses / budget) * 100 : 0;
  const isOverBudget = hasBudgetLimit(budget) && totalExpenses > budget;
  const remaining = hasBudgetLimit(budget) ? subtractAmounts(budget, totalExpenses) : 0;

  return { totalExpenses, budgetPercentage, isOverBudget, remaining };
}
