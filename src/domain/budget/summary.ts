import { sumAmounts, subtractAmounts } from '../money/arithmetic';

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
  budget: number,
  expenseAmounts: number[],
): BudgetSummary {
  const totalExpenses = sumAmounts(expenseAmounts);
  const budgetPercentage = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const isOverBudget = budget > 0 && totalExpenses > budget;
  const remaining = subtractAmounts(budget, totalExpenses);

  return { totalExpenses, budgetPercentage, isOverBudget, remaining };
}
