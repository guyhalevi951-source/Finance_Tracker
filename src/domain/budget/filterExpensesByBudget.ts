import { type Expense } from '../../types/expense';
import { MASTER_BUDGET_ID } from './constants';

export function filterExpensesByBudget(
  expenses: Expense[],
  activeBudgetId: string,
): Expense[] {
  if (activeBudgetId === MASTER_BUDGET_ID) {
    return expenses;
  }
  return expenses.filter((expense) => expense.budgetId === activeBudgetId);
}
