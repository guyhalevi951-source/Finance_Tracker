import { type BudgetStore, type MonthBudgetEntry } from '../../types/budget';

export interface MonthBudgetPatch {
  amount?: number | null;
  carryOverToNext?: boolean;
}

function defaultEntry(): MonthBudgetEntry {
  return { amount: null, carryOverToNext: true };
}

/** Upsert a single month entry without mutating other months. */
export function upsertMonthBudgetEntry(
  store: BudgetStore,
  monthKey: string,
  patch: MonthBudgetPatch,
): BudgetStore {
  const existing = store[monthKey] ?? defaultEntry();

  return {
    ...store,
    [monthKey]: {
      amount: patch.amount !== undefined ? patch.amount : existing.amount,
      carryOverToNext:
        patch.carryOverToNext !== undefined ? patch.carryOverToNext : existing.carryOverToNext,
    },
  };
}

export function getMonthBudgetEntry(store: BudgetStore, monthKey: string): MonthBudgetEntry {
  return store[monthKey] ?? defaultEntry();
}
