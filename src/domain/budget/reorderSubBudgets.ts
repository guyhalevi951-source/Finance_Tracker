import { type SubBudgetRecord } from '../../types/budget';

/** Recompute sortOrder for sub-budgets only; master is never in this list. */
export function reorderSubBudgets(
  budgets: SubBudgetRecord[],
  orderedIds: string[],
): SubBudgetRecord[] {
  const byId = new Map(budgets.map((budget) => [budget.id, budget]));

  return orderedIds
    .map((id, index) => {
      const budget = byId.get(id);
      if (!budget) return null;
      return { ...budget, sortOrder: index };
    })
    .filter((budget): budget is SubBudgetRecord => budget !== null);
}
