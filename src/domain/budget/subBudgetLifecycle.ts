import { type SubBudgetRecord, type TemporarySubBudgetRecord } from '../../types/budget';
import { isTemporarySubBudget } from './subBudgetKind';

/** Fixed budgets are open-ended and never archive; temporary budgets archive after `endDate`. */
export function isSubBudgetArchived(budget: SubBudgetRecord, todayIso: string): boolean {
  return isTemporarySubBudget(budget) && budget.endDate < todayIso;
}

export function canPurgeFromHistory(budget: SubBudgetRecord, todayIso: string): boolean {
  return isSubBudgetArchived(budget, todayIso) && !budget.purgedFromHistory;
}

export function listActiveSubBudgets(
  budgets: SubBudgetRecord[],
  todayIso: string,
): SubBudgetRecord[] {
  return budgets
    .filter((budget) => !isSubBudgetArchived(budget, todayIso))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listArchivedSubBudgets(
  budgets: SubBudgetRecord[],
  todayIso: string,
): TemporarySubBudgetRecord[] {
  return budgets
    .filter(isTemporarySubBudget)
    .filter(
      (budget) => isSubBudgetArchived(budget, todayIso) && !budget.purgedFromHistory,
    )
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
}

export function findArchivedSubBudget(
  budgets: SubBudgetRecord[],
  id: string,
  todayIso: string,
): TemporarySubBudgetRecord | null {
  return listArchivedSubBudgets(budgets, todayIso).find((budget) => budget.id === id) ?? null;
}

export function purgeArchivedSubBudget(
  budgets: SubBudgetRecord[],
  id: string,
  todayIso: string,
): SubBudgetRecord[] {
  const target = budgets.find((budget) => budget.id === id);
  if (!target || !canPurgeFromHistory(target, todayIso)) {
    return budgets;
  }

  return budgets.map((budget) =>
    budget.id === id ? { ...budget, purgedFromHistory: true } : budget,
  );
}
