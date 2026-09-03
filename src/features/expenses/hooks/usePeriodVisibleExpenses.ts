import { useMemo } from 'react';
import { filterExpensesByBudget } from '../../../domain/budget/filterExpensesByBudget';
import { filterExpensesByPeriod, type DateRange } from '../../../domain/expenses/periods';
import { filterTimelineVisibleExpenses } from '../../../domain/recurrence/filterTimelineVisibleExpenses';
import { type Expense } from '../../../types/expense';

export function usePeriodVisibleExpenses(
  expenses: Expense[],
  range: DateRange,
  activeBudgetId: string,
  todayIso: string,
): Expense[] {
  return useMemo(
    () =>
      filterExpensesByPeriod(
        filterTimelineVisibleExpenses(filterExpensesByBudget(expenses, activeBudgetId), todayIso),
        range,
      ),
    [expenses, range, activeBudgetId, todayIso],
  );
}
