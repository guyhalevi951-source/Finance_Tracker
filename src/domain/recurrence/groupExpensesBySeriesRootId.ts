import { type Expense } from '../../types/expense';
import { resolveSeriesRootId } from './resolveSeriesTemplate';

export interface SeriesExpenseGroup {
  rootId: string;
  expenses: Expense[];
}

/**
 * Groups recurring expenses by their series root id.
 * Non-recurring rows and rows without a resolvable root id are omitted.
 */
export function groupExpensesBySeriesRootId(expenses: Expense[]): SeriesExpenseGroup[] {
  const groups = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const rootId = resolveSeriesRootId(expense);
    if (!rootId) continue;

    const existing = groups.get(rootId);
    if (existing) {
      existing.push(expense);
    } else {
      groups.set(rootId, [expense]);
    }
  }

  return Array.from(groups.entries()).map(([rootId, groupExpenses]) => ({
    rootId,
    expenses: groupExpenses,
  }));
}

export function findBulkEligibleSeriesGroups(
  expenses: Expense[],
  minSelectedCount = 2,
): SeriesExpenseGroup[] {
  return groupExpensesBySeriesRootId(expenses).filter(
    (group) => group.expenses.length >= minSelectedCount,
  );
}
