import { type Expense } from '../../types/expense';

export function isRecurringExpense(expense: Expense): boolean {
  return expense.recurrenceRule !== undefined || expense.recurrenceSeriesId !== undefined;
}
