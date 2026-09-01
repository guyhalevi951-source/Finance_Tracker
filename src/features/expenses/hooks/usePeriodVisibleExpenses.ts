import { useMemo } from 'react';
import { filterExpensesByPeriod, type DateRange } from '../../../domain/expenses/periods';
import { filterTimelineVisibleExpenses } from '../../../domain/recurrence/filterTimelineVisibleExpenses';
import { type Expense } from '../../../types/expense';

export function usePeriodVisibleExpenses(
  expenses: Expense[],
  range: DateRange,
): Expense[] {
  return useMemo(
    () => filterExpensesByPeriod(filterTimelineVisibleExpenses(expenses), range),
    [expenses, range],
  );
}
