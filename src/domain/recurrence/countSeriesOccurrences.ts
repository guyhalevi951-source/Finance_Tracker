import { type Expense } from '../../types/expense';

export function countSeriesOccurrences(expenses: Expense[], templateId: string): number {
  return expenses.filter(
    (expense) => expense.id === templateId || expense.recurrenceSeriesId === templateId,
  ).length;
}

/** Materialized rows plus excluded dates (deleted slots that still consume the occurrence budget). */
export function countConsumedSeriesOccurrences(
  expenses: Expense[],
  template: Expense,
): number {
  const excludedCount = template.recurrenceExcludedDates?.length ?? 0;
  return countSeriesOccurrences(expenses, template.id) + excludedCount;
}
