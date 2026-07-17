import { type Expense } from '../../types/expense';

export function countSeriesOccurrences(expenses: Expense[], templateId: string): number {
  return expenses.filter(
    (expense) => expense.id === templateId || expense.recurrenceSeriesId === templateId,
  ).length;
}
