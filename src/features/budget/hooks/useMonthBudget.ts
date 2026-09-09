import { useCallback, useEffect, useMemo, useState } from 'react';
import { toMonthKey } from '../../../domain/budget/monthKey';
import { resolveMonthBudget } from '../../../domain/budget/resolveMonthBudget';
import { loadBudgetStore, saveBudgetStore } from '../../../services/storage/budgetLocalStorage';
import { type BudgetStore } from '../../../types/budget';
import { useMonthBudgetController, type MonthBudgetController } from './useMonthBudgetController';

export interface UseMonthBudgetReturn extends MonthBudgetController {
  loadError: string | null;
}

function readInitialStore(): BudgetStore {
  const result = loadBudgetStore();
  return result.ok ? result.value : {};
}

/** Master monthly budget: month store lives in localStorage (`monthlyBudgetStore`). */
export function useMonthBudget(year: number, month: number): UseMonthBudgetReturn {
  const [store, setStore] = useState<BudgetStore>(readInitialStore);
  const [loadError, setLoadError] = useState<string | null>(null);
  const monthKey = useMemo(() => toMonthKey(year, month), [year, month]);

  useEffect(() => {
    const result = loadBudgetStore();
    if (result.ok) {
      setStore((prev) => (Object.keys(prev).length === 0 ? result.value : prev));
    } else {
      console.warn(`[useMonthBudget] Could not load budget store: ${result.error}`);
      setLoadError('budget');
    }
  }, []);

  const persistStore = useCallback((nextStore: BudgetStore) => {
    setStore(nextStore);
    saveBudgetStore(nextStore);
  }, []);

  const resolved = useMemo(() => resolveMonthBudget(store, monthKey), [store, monthKey]);

  const controller = useMonthBudgetController({ store, monthKey, resolved, persistStore });

  return { ...controller, loadError };
}
