import { type BudgetStore } from '../../types/budget';
import { getMonthBudgetEntry } from './budgetStorePolicy';
import { previousMonthKey } from './monthKey';

export type MonthBudgetSource = 'explicit' | 'inherited' | 'none';

export interface ResolvedMonthBudget {
  amount: number;
  source: MonthBudgetSource;
  carryOverToNext: boolean;
  isExplicit: boolean;
}

function zeroResult(carryOverToNext: boolean): ResolvedMonthBudget {
  return {
    amount: 0,
    source: 'none',
    carryOverToNext,
    isExplicit: false,
  };
}

export function resolveMonthBudget(store: BudgetStore, monthKey: string): ResolvedMonthBudget {
  const entry = getMonthBudgetEntry(store, monthKey);

  if (entry.amount !== null) {
    return {
      amount: entry.amount,
      source: 'explicit',
      carryOverToNext: entry.carryOverToNext,
      isExplicit: true,
    };
  }

  const immediatePrevKey = previousMonthKey(monthKey);
  if (immediatePrevKey === null) {
    return zeroResult(entry.carryOverToNext);
  }

  if (!getMonthBudgetEntry(store, immediatePrevKey).carryOverToNext) {
    return zeroResult(entry.carryOverToNext);
  }

  let cursor: string | null = immediatePrevKey;

  while (cursor !== null) {
    const cursorEntry = getMonthBudgetEntry(store, cursor);

    if (cursorEntry.amount !== null) {
      return {
        amount: cursorEntry.amount,
        source: 'inherited',
        carryOverToNext: entry.carryOverToNext,
        isExplicit: false,
      };
    }

    const prevKey = previousMonthKey(cursor);
    if (prevKey === null || !getMonthBudgetEntry(store, prevKey).carryOverToNext) {
      return zeroResult(entry.carryOverToNext);
    }

    cursor = prevKey;
  }

  return zeroResult(entry.carryOverToNext);
}
