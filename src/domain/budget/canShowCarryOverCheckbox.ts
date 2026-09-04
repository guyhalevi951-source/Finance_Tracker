import { type BudgetStore } from '../../types/budget';
import { getMonthBudgetEntry } from './budgetStorePolicy';
import { nextMonthKey } from './monthKey';

/** Whether the carryover checkbox should appear for the given month. Hidden only when N+1 has a manually saved amount. */
export function canShowCarryOverCheckbox(store: BudgetStore, monthKey: string): boolean {
  const nextKey = nextMonthKey(monthKey);
  if (nextKey === null) {
    return true;
  }

  return getMonthBudgetEntry(store, nextKey).amount === null;
}
