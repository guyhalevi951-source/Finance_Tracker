import { useMemo } from 'react';
import { filterExpensesByBudget } from '../../../domain/budget/filterExpensesByBudget';
import {
  filterPeriodBreakdownExpenses,
  type PeriodBreakdownExpenseMode,
} from '../../../domain/budget/filterPeriodBreakdownExpenses';
import { type DateRange } from '../../../domain/expenses/periods';
import { type SubBudgetRecord } from '../../../types/budget';
import { type Expense } from '../../../types/expense';

export function usePeriodBreakdownExpenses(
  expenses: Expense[],
  range: DateRange,
  activeBudgetId: string,
  todayIso: string,
  subBudgets: SubBudgetRecord[],
  mode: PeriodBreakdownExpenseMode,
): Expense[] {
  return useMemo(
    () =>
      filterPeriodBreakdownExpenses({
        expenses: filterExpensesByBudget(expenses, activeBudgetId),
        range,
        todayIso,
        subBudgets,
        mode,
      }),
    [expenses, range, activeBudgetId, todayIso, subBudgets, mode],
  );
}
