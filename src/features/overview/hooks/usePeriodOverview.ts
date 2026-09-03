import { useEffect, useMemo, useState } from 'react';
import { MASTER_BUDGET_ID } from '../../../domain/budget/constants';
import { monthKeyFromRangeStart } from '../../../domain/budget/monthKey';
import {
  computeOverviewForPeriodBudget,
  computePeriodOverview,
  type PeriodOverview,
} from '../../../domain/budget/periodOverview';
import { resolveMonthBudget } from '../../../domain/budget/resolveMonthBudget';
import { type DateRange } from '../../../domain/expenses/periods';
import { loadBudgetStore } from '../../../services/storage/budgetLocalStorage';
import { type BudgetStore, type SubBudgetRecord } from '../../../types/budget';
import { type Expense } from '../../../types/expense';

export interface UsePeriodOverviewOptions {
  activeBudgetId: string;
  subBudget: SubBudgetRecord | null;
  subBudgets?: SubBudgetRecord[];
}

export interface UsePeriodOverviewReturn {
  overview: PeriodOverview;
  monthlyBudget: number;
  hasBudget: boolean;
  effectiveRange: DateRange;
  loadError: string | null;
}

export function usePeriodOverview(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
  options: UsePeriodOverviewOptions,
): UsePeriodOverviewReturn {
  const [store, setStore] = useState<BudgetStore>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const { activeBudgetId, subBudget, subBudgets = [] } = options;
  const isMaster = activeBudgetId === MASTER_BUDGET_ID;

  useEffect(() => {
    const budgetResult = loadBudgetStore();
    if (budgetResult.ok) {
      setStore(budgetResult.value);
    } else {
      console.warn(`[usePeriodOverview] Could not load budget store: ${budgetResult.error}`);
      setLoadError('budget');
    }
  }, []);

  const effectiveRange = useMemo<DateRange>(() => {
    if (isMaster || !subBudget) return range;
    return { startIso: subBudget.startDate, endIso: subBudget.endDate };
  }, [isMaster, subBudget, range]);

  const monthlyBudget = useMemo(() => {
    if (!isMaster && subBudget) return subBudget.totalAmount;
    const monthKey = monthKeyFromRangeStart(range.startIso);
    return resolveMonthBudget(store, monthKey).amount;
  }, [isMaster, subBudget, range.startIso, store]);

  const overview = useMemo(() => {
    if (!isMaster && subBudget) {
      return computeOverviewForPeriodBudget({
        periodBudget: subBudget.totalAmount,
        expenses,
        range: effectiveRange,
        todayIso,
        subBudgets,
      });
    }
    return computePeriodOverview({
      monthlyBudget,
      expenses,
      range,
      todayIso,
      subBudgets,
    });
  }, [isMaster, subBudget, monthlyBudget, expenses, range, effectiveRange, todayIso, subBudgets]);

  return {
    overview,
    monthlyBudget,
    hasBudget: monthlyBudget > 0,
    effectiveRange,
    loadError,
  };
}
