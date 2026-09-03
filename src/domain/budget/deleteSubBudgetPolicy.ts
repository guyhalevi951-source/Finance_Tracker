import { type Expense } from '../../types/expense';

export function collectSubBudgetExpenseIds(expenses: Expense[], budgetId: string): string[] {
  return expenses.filter((expense) => expense.budgetId === budgetId).map((expense) => expense.id);
}

export function detachExpensesFromBudget(expenses: Expense[], budgetId: string): Expense[] {
  return expenses.map((expense) => {
    if (expense.budgetId !== budgetId) {
      return expense;
    }
    const { budgetId: _removed, ...rest } = expense;
    return rest;
  });
}
