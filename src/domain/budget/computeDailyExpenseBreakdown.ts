import { type Expense } from '../../types/expense';
import { type SubBudgetRecord } from '../../types/budget';
import { resolveSubBudgetEndDate } from './subBudgetExpenseWindow';
import { isScheduledOneTimeExpense } from '../expenses/scheduled';
import { type DateRange, enumerateDaysInRange } from '../expenses/periods';
import { sumAmounts } from '../money/arithmetic';
import { shouldShowExpenseOnTimeline } from '../recurrence/filterTimelineVisibleExpenses';
import { listActiveRecurrenceTemplates } from '../recurrence/listActiveRecurrenceTemplates';
import { computeProjectedFutureOccurrenceDates } from '../recurrence/computeProjectedFutureOccurrenceDates';

export interface DailyExpenseBreakdown {
  dateIso: string;
  actualExpenses: number;
  futureExpenses: number;
  total: number;
}

function isInRange(dateIso: string, range: DateRange): boolean {
  return dateIso >= range.startIso && dateIso <= range.endIso;
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

function classifyStoredExpenses(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
  buckets: Map<string, { actual: number; future: number }>,
): void {
  for (const expense of expenses) {
    if (!isInRange(expense.date, range)) continue;

    if (isScheduledOneTimeExpense(expense)) {
      addToBucket(buckets, expense.date, expense.amount, 'future');
      continue;
    }

    if (expense.date > todayIso) {
      addToBucket(buckets, expense.date, expense.amount, 'future');
      continue;
    }

    if (shouldShowExpenseOnTimeline(expense)) {
      addToBucket(buckets, expense.date, expense.amount, 'actual');
    }
  }
}

function projectFutureRecurringExpenses(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
  buckets: Map<string, { actual: number; future: number }>,
  subBudgets: SubBudgetRecord[],
): void {
  const templates = listActiveRecurrenceTemplates(expenses, todayIso);
  if (templates.length === 0) return;

  for (const template of templates) {
    const capEndDateIso = resolveSubBudgetEndDate(subBudgets, template.budgetId);
    const globalProjectedDates = computeProjectedFutureOccurrenceDates(
      expenses,
      template,
      todayIso,
      capEndDateIso,
    );

    const datesInRange = globalProjectedDates.filter((dateIso) => isInRange(dateIso, range));

    for (const dateIso of datesInRange) {
      addToBucket(buckets, dateIso, template.amount, 'future');
    }
  }
}

export function computeDailyExpenseBreakdown(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
  subBudgets: SubBudgetRecord[] = [],
): DailyExpenseBreakdown[] {
  const buckets = new Map<string, { actual: number; future: number }>();

  classifyStoredExpenses(expenses, range, todayIso, buckets);
  projectFutureRecurringExpenses(expenses, range, todayIso, buckets, subBudgets);

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
