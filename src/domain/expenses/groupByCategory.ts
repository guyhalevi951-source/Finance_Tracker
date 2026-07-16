import { type Expense } from '../../types/expense';
import { getParentCategoryId } from '../categories/hierarchy';
import { sumAmounts } from '../money/arithmetic';
import { isoDateToDate } from './parseExpenseDate';

export interface ExpenseCategoryGroup {
  categoryId: string;
  total: number;
  expenses: Expense[];
}

export function groupExpensesByCategory(expenses: Expense[]): ExpenseCategoryGroup[] {
  const map = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const parentId = getParentCategoryId(expense.category);
    const existing = map.get(parentId);
    if (existing) {
      existing.push(expense);
    } else {
      map.set(parentId, [expense]);
    }
  }

  return Array.from(map.entries())
    .map(([categoryId, groupExpenses]) => ({
      categoryId,
      total: sumAmounts(groupExpenses.map((e) => e.amount)),
      expenses: [...groupExpenses].sort(
        (a, b) => isoDateToDate(b.date).getTime() - isoDateToDate(a.date).getTime() || b.id.localeCompare(a.id),
      ),
    }))
    .sort((a, b) => b.total - a.total || a.categoryId.localeCompare(b.categoryId));
}
