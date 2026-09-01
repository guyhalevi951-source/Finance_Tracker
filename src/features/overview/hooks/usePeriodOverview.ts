import { useEffect, useMemo, useState } from 'react';
import { type DateRange } from '../../../domain/expenses/periods';
import { computePeriodOverview, type PeriodOverview } from '../../../domain/budget/periodOverview';
import { loadBudget } from '../../../services/storage/budgetLocalStorage';
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
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const budgetResult = loadBudget();
    if (budgetResult.ok) {
      setMonthlyBudget(budgetResult.value);
    } else if (budgetResult.error !== 'NOT_FOUND') {
      console.warn(`[usePeriodOverview] Could not load budget: ${budgetResult.error}`);
      setLoadError('budget');
    }
  }, []);

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
