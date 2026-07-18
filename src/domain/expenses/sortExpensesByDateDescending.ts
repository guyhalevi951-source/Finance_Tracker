import { type Expense } from '../../types/expense';

/** Newest/latest date first — required for safe same-series bulk delete/edit. */
export function sortExpensesByDateDescending(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => b.date.localeCompare(a.date));
}
