import { type SubBudgetRecord } from '../../types/budget';

/**
 * Recompute sortOrder for the budgets listed in `orderedIds` (one kind group at a time);
 * budgets not listed keep their record and sortOrder. Master is never in this list.
 */
export function reorderSubBudgets(
  budgets: SubBudgetRecord[],
  orderedIds: string[],
): SubBudgetRecord[] {
  const nextSortOrder = new Map(orderedIds.map((id, index) => [id, index]));

  return budgets.map((budget) => {
    const sortOrder = nextSortOrder.get(budget.id);
    return sortOrder === undefined ? budget : { ...budget, sortOrder };
  });
}
