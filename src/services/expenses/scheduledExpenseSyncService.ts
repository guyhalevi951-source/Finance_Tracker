import { type Expense } from '../../types/expense';
import { materializeDueScheduledExpenses } from '../../domain/expenses/scheduled';
import { applyExpenseBatch, loadExpenses } from './expenseRepository';

export interface SyncScheduledOneTimeExpensesResult {
  materializedCount: number;
  expenses: Expense[];
}

export async function syncScheduledOneTimeExpenses(
  userId: string | null,
  expenses: Expense[],
  todayIso: string,
): Promise<SyncScheduledOneTimeExpensesResult> {
  const materialized = materializeDueScheduledExpenses(expenses, todayIso);

  if (materialized === expenses) {
    return { materializedCount: 0, expenses };
  }

  const materializedCount = materialized.filter(
    (expense, index) => expense !== expenses[index],
  ).length;

  await applyExpenseBatch(userId, materialized);
  const refreshed = await loadExpenses(userId);

  return { materializedCount, expenses: refreshed };
}
