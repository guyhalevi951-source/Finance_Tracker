import { useEffect, useMemo, useState } from 'react';
import { MASTER_BUDGET_ID } from '../../../domain/budget/constants';
import { resolveFixedBudgetMonthAmount } from '../../../domain/budget/fixedBudgetMonth';
import { monthKeyFromRangeStart } from '../../../domain/budget/monthKey';
import {
  computeOverviewForPeriodBudget,
  computePeriodOverview,
  type PeriodOverview,
} from '../../../domain/budget/periodOverview';
import { hasBudgetLimit } from '../../../domain/budget/hasBudgetLimit';
import { resolveMonthBudget } from '../../../domain/budget/resolveMonthBudget';
import { isTemporarySubBudget } from '../../../domain/budget/subBudgetKind';
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
  monthlyBudget: number | null;
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
  // Temporary budgets span a fixed window; master and fixed budgets follow the selected month.
  const temporaryBudget = !isMaster && subBudget && isTemporarySubBudget(subBudget) ? subBudget : null;
  const fixedBudget = !isMaster && subBudget && !isTemporarySubBudget(subBudget) ? subBudget : null;

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
    if (!temporaryBudget) return range;
    return { startIso: temporaryBudget.startDate, endIso: temporaryBudget.endDate };
  }, [temporaryBudget, range]);

  const monthlyBudget = useMemo(() => {
    if (temporaryBudget) return temporaryBudget.totalAmount;
    const monthKey = monthKeyFromRangeStart(range.startIso);
    if (fixedBudget) return resolveFixedBudgetMonthAmount(fixedBudget, monthKey).amount;
    return resolveMonthBudget(store, monthKey).amount;
  }, [temporaryBudget, fixedBudget, range.startIso, store]);

  const overview = useMemo(() => {
    if (temporaryBudget) {
      return computeOverviewForPeriodBudget({
        periodBudget: temporaryBudget.totalAmount,
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
  }, [temporaryBudget, monthlyBudget, expenses, range, effectiveRange, todayIso, subBudgets]);

  return {
    overview,
    monthlyBudget,
    hasBudget: hasBudgetLimit(monthlyBudget),
    effectiveRange,
    loadError,
  };
}
