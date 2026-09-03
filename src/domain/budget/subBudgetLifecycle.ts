import { type SubBudgetRecord } from '../../types/budget';

export function isSubBudgetArchived(budget: SubBudgetRecord, todayIso: string): boolean {
  return budget.endDate < todayIso;
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
): SubBudgetRecord[] {
  return budgets
    .filter(
      (budget) => isSubBudgetArchived(budget, todayIso) && !budget.purgedFromHistory,
    )
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
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
