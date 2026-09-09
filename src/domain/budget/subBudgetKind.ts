import {
  type FixedSubBudgetRecord,
  type SubBudgetRecord,
  type TemporarySubBudgetRecord,
} from '../../types/budget';

export function isFixedSubBudget(budget: SubBudgetRecord): budget is FixedSubBudgetRecord {
  return budget.kind === 'fixed';
}

export function isTemporarySubBudget(
  budget: SubBudgetRecord,
): budget is TemporarySubBudgetRecord {
  return budget.kind === 'temporary';
}

function bySortOrder(a: SubBudgetRecord, b: SubBudgetRecord): number {
  return a.sortOrder - b.sortOrder;
}

export interface SubBudgetsByKind {
  fixed: FixedSubBudgetRecord[];
  temporary: TemporarySubBudgetRecord[];
}

/** Splits budgets into kind groups, each sorted by its own `sortOrder`. */
export function partitionSubBudgetsByKind(budgets: SubBudgetRecord[]): SubBudgetsByKind {
  return {
    fixed: budgets.filter(isFixedSubBudget).sort(bySortOrder),
    temporary: budgets.filter(isTemporarySubBudget).sort(bySortOrder),
  };
}

/** Global switcher order: all fixed budgets (accordion order) then all temporary budgets. */
export function listBudgetsForSwitcher(budgets: SubBudgetRecord[]): SubBudgetRecord[] {
  const { fixed, temporary } = partitionSubBudgetsByKind(budgets);
  return [...fixed, ...temporary];
}
