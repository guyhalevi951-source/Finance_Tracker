import { useMemo } from 'react';
import { filterExpensesByBudget } from '../../../domain/budget/filterExpensesByBudget';
import { filterExpensesByPeriod, type DateRange } from '../../../domain/expenses/periods';
import { filterTimelineVisibleExpenses } from '../../../domain/recurrence/filterTimelineVisibleExpenses';
import { type SubBudgetRecord } from '../../../types/budget';
import { type Expense } from '../../../types/expense';

export function usePeriodVisibleExpenses(
  expenses: Expense[],
  range: DateRange,
  activeBudgetId: string,
  subBudgets: SubBudgetRecord[],
  todayIso: string,
): Expense[] {
  return useMemo(
    () =>
      filterExpensesByPeriod(
        filterTimelineVisibleExpenses(
          filterExpensesByBudget(expenses, activeBudgetId, subBudgets),
          todayIso,
        ),
        range,
      ),
    [expenses, range, activeBudgetId, subBudgets, todayIso],
  );
}
