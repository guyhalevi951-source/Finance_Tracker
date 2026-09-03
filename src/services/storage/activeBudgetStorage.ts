import { MASTER_BUDGET_ID } from '../../domain/budget/constants';

const ACTIVE_BUDGET_KEY = 'activeBudgetId';

export function loadActiveBudgetId(): string {
  const raw = localStorage.getItem(ACTIVE_BUDGET_KEY);
  return raw ?? MASTER_BUDGET_ID;
}

export function saveActiveBudgetId(budgetId: string): void {
  localStorage.setItem(ACTIVE_BUDGET_KEY, budgetId);
}
