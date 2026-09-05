import { type Expense } from '../../types/expense';
import { type SubBudgetRecord } from '../../types/budget';
import { type DateRange, enumerateDaysInRange } from '../expenses/periods';
import { sumAmounts } from '../money/arithmetic';
import { collectPeriodBreakdownExpenses } from './collectPeriodBreakdownExpenses';

export interface DailyExpenseBreakdown {
  dateIso: string;
  actualExpenses: number;
  futureExpenses: number;
  total: number;
}

function addToBucket(
  buckets: Map<string, { actual: number; future: number }>,
  dateIso: string,
  amount: number,
  bucket: 'actual' | 'future',
): void {
  const existing = buckets.get(dateIso) ?? { actual: 0, future: 0 };
  if (bucket === 'actual') {
    existing.actual = sumAmounts([existing.actual, amount]);
  } else {
    existing.future = sumAmounts([existing.future, amount]);
  }
  buckets.set(dateIso, existing);
}

export function computeDailyExpenseBreakdown(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
  subBudgets: SubBudgetRecord[] = [],
): DailyExpenseBreakdown[] {
  const { actual, future } = collectPeriodBreakdownExpenses(
    expenses,
    range,
    todayIso,
    subBudgets,
  );
  const buckets = new Map<string, { actual: number; future: number }>();

  for (const expense of actual) {
    addToBucket(buckets, expense.date, expense.amount, 'actual');
  }
  for (const expense of future) {
    addToBucket(buckets, expense.date, expense.amount, 'future');
  }

  return enumerateDaysInRange(range).map((dateIso) => {
    const day = buckets.get(dateIso) ?? { actual: 0, future: 0 };
    return {
      dateIso,
      actualExpenses: day.actual,
      futureExpenses: day.future,
      total: sumAmounts([day.actual, day.future]),
    };
  });
}
