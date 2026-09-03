import { useEffect, useMemo, useState } from 'react';
import { monthKeyFromRangeStart } from '../../../domain/budget/monthKey';
import { resolveMonthBudget } from '../../../domain/budget/resolveMonthBudget';
import { type DateRange } from '../../../domain/expenses/periods';
import { computePeriodOverview, type PeriodOverview } from '../../../domain/budget/periodOverview';
import { loadBudgetStore } from '../../../services/storage/budgetLocalStorage';
import { type BudgetStore } from '../../../types/budget';
import { type Expense } from '../../../types/expense';

export interface UsePeriodOverviewReturn {
  overview: PeriodOverview;
  monthlyBudget: number;
  hasBudget: boolean;
  loadError: string | null;
}

export function usePeriodOverview(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
): UsePeriodOverviewReturn {
  const [store, setStore] = useState<BudgetStore>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const budgetResult = loadBudgetStore();
    if (budgetResult.ok) {
      setStore(budgetResult.value);
    } else {
      console.warn(`[usePeriodOverview] Could not load budget store: ${budgetResult.error}`);
      setLoadError('budget');
    }
  }, []);

  const monthKey = useMemo(() => monthKeyFromRangeStart(range.startIso), [range.startIso]);

  const monthlyBudget = useMemo(
    () => resolveMonthBudget(store, monthKey).amount,
    [store, monthKey],
  );

  const overview = useMemo(
    () =>
      computePeriodOverview({
        monthlyBudget,
        expenses,
        range,
        todayIso,
      }),
    [monthlyBudget, expenses, range, todayIso],
  );

  return {
    overview,
    monthlyBudget,
    hasBudget: monthlyBudget > 0,
    loadError,
  };
}
