import { type Expense } from '../../types/expense';
import { type SubBudgetRecord } from '../../types/budget';
import { type DateRange } from '../expenses/periods';
import { collectPeriodBreakdownExpenses } from './collectPeriodBreakdownExpenses';

export type PeriodBreakdownExpenseMode = 'actual' | 'planned';

export function filterPeriodBreakdownExpenses({
  expenses,
  range,
  todayIso,
  subBudgets = [],
  mode,
}: {
  expenses: Expense[];
  range: DateRange;
  todayIso: string;
  subBudgets?: SubBudgetRecord[];
  mode: PeriodBreakdownExpenseMode;
}): Expense[] {
  const { actual, future } = collectPeriodBreakdownExpenses(
    expenses,
    range,
    todayIso,
    subBudgets,
  );

  if (mode === 'actual') return actual;
  return [...actual, ...future];
}
