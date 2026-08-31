import { type Expense } from '../../types/expense';

export function countSeriesOccurrences(expenses: Expense[], templateId: string): number {
  return expenses.filter(
    (expense) => expense.id === templateId || expense.recurrenceSeriesId === templateId,
  ).length;
}

function collectMaterializedSeriesDates(expenses: Expense[], templateId: string): Set<string> {
  const dates = new Set<string>();
  for (const expense of expenses) {
    if (expense.id === templateId || expense.recurrenceSeriesId === templateId) {
      dates.add(expense.date);
    }
  }
  return dates;
}

/** Excluded dates whose occurrence slot no longer has a materialized row in the series. */
export function countExcludedSlotsNotMaterialized(expenses: Expense[], template: Expense): number {
  const materializedDates = collectMaterializedSeriesDates(expenses, template.id);
  const excludedDates = template.recurrenceExcludedDates ?? [];
  return excludedDates.filter((date) => !materializedDates.has(date)).length;
}

/** Materialized rows plus excluded dates for deleted slots (no double-count when anchor row remains). */
export function countConsumedSeriesOccurrences(
  expenses: Expense[],
  template: Expense,
): number {
  const materializedCount = countSeriesOccurrences(expenses, template.id);
  const excludedSlots = countExcludedSlotsNotMaterialized(expenses, template);
  return materializedCount + excludedSlots;
}
