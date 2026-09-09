import { type SubBudgetRecord } from '../../types/budget';
import { type Expense } from '../../types/expense';
import { MASTER_BUDGET_ID } from './constants';

function collectIsolatedBudgetIds(subBudgets: SubBudgetRecord[]): Set<string> {
  return new Set(
    subBudgets
      .filter((budget) => !budget.includeInMonthlyBudget)
      .map((budget) => budget.id),
  );
}

/**
 * Master view shows every expense except those tagged to an isolated sub-budget
 * (`includeInMonthlyBudget === false`). Pass the full sub-budget list (including archived)
 * so isolated budgets stay excluded after they expire.
 */
export function filterExpensesByBudget(
  expenses: Expense[],
  activeBudgetId: string,
  subBudgets: SubBudgetRecord[],
): Expense[] {
  if (activeBudgetId === MASTER_BUDGET_ID) {
    const isolatedIds = collectIsolatedBudgetIds(subBudgets);
    if (isolatedIds.size === 0) return expenses;
    return expenses.filter(
      (expense) => expense.budgetId === undefined || !isolatedIds.has(expense.budgetId),
    );
  }
  return expenses.filter((expense) => expense.budgetId === activeBudgetId);
}
