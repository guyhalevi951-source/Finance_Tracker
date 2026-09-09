import { findArchivedSubBudget } from '../../../domain/budget/subBudgetLifecycle';
import { filterExpensesByBudget } from '../../../domain/budget/filterExpensesByBudget';
import { type SubBudgetRecord, type TemporarySubBudgetRecord } from '../../../types/budget';
import { useBudgets } from '../../budget/hooks/useBudgets';
import { useExpenses } from '../../expenses/hooks/useExpenses';
import { useTodayIso } from '../../../lib/hooks/useTodayIso';
import { usePeriodOverview } from './usePeriodOverview';
import { usePeriodBreakdownExpenses } from './usePeriodBreakdownExpenses';
import { type PeriodOverview } from '../../../domain/budget/periodOverview';
import { type DateRange } from '../../../domain/expenses/periods';
import { type Expense } from '../../../types/expense';

const PLACEHOLDER_RANGE: DateRange = { startIso: '1970-01-01', endIso: '1970-01-01' };

export interface UseHistoricalPeriodOverviewReturn {
  budget: TemporarySubBudgetRecord | null;
  notFound: boolean;
  overview: PeriodOverview;
  hasBudget: boolean;
  effectiveRange: DateRange;
  todayIso: string;
  subBudgets: SubBudgetRecord[];
  breakdownExpenses: Expense[];
  showDataModeControls: false;
  loadError: boolean;
}

export function useHistoricalPeriodOverview(
  budgetId: string | undefined,
): UseHistoricalPeriodOverviewReturn {
  const todayIso = useTodayIso();
  const { subBudgets } = useBudgets();
  const { expenses, loadError: expensesLoadError } = useExpenses();

  const budget =
    budgetId === undefined ? null : findArchivedSubBudget(subBudgets, budgetId, todayIso);

  const scopedExpenses = budget ? filterExpensesByBudget(expenses, budget.id, subBudgets) : [];
  const range = budget
    ? { startIso: budget.startDate, endIso: budget.endDate }
    : PLACEHOLDER_RANGE;

  const { overview, hasBudget, effectiveRange, loadError: budgetLoadError } = usePeriodOverview(
    scopedExpenses,
    range,
    todayIso,
    {
      activeBudgetId: budget?.id ?? '',
      subBudget: budget,
      subBudgets,
    },
  );

  const breakdownExpenses = usePeriodBreakdownExpenses(
    expenses,
    effectiveRange,
    budget?.id ?? '',
    todayIso,
    subBudgets,
    'actual',
  );

  return {
    budget,
    notFound: budget === null,
    overview,
    hasBudget,
    effectiveRange,
    todayIso,
    subBudgets,
    breakdownExpenses,
    showDataModeControls: false,
    loadError: Boolean(budgetLoadError) || expensesLoadError,
  };
}
