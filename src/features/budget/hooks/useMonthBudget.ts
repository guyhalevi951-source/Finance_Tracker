import { useCallback, useEffect, useMemo, useState } from 'react';
import { toMonthKey } from '../../../domain/budget/monthKey';
import { resolveMonthBudget } from '../../../domain/budget/resolveMonthBudget';
import { loadBudgetStore, saveBudgetStore } from '../../../services/budgets/monthlyBudgetRepository';
import { type BudgetStore } from '../../../types/budget';
import { useAuthSession } from '../../auth/hooks/useAuthSession';
import { useMonthBudgetController, type MonthBudgetController } from './useMonthBudgetController';

export interface UseMonthBudgetReturn extends MonthBudgetController {
  loadError: string | null;
}

/** Master monthly budget: month store is guest localStorage or authenticated Supabase. */
export function useMonthBudget(year: number, month: number): UseMonthBudgetReturn {
  const { userId } = useAuthSession();
  const [store, setStore] = useState<BudgetStore>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const monthKey = useMemo(() => toMonthKey(year, month), [year, month]);

  useEffect(() => {
    let cancelled = false;
    void loadBudgetStore(userId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setStore(result.value);
        setLoadError(null);
      } else {
        console.warn(`[useMonthBudget] Could not load budget store: ${result.error}`);
        setLoadError('budget');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistStore = useCallback(
    (nextStore: BudgetStore) => {
      setStore(nextStore);
      void saveBudgetStore(userId, nextStore);
    },
    [userId],
  );

  const resolved = useMemo(() => resolveMonthBudget(store, monthKey), [store, monthKey]);

  const controller = useMonthBudgetController({ store, monthKey, resolved, persistStore });

  return { ...controller, loadError };
}
