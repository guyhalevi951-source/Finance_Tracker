import { type Expense } from '../../types/expense';
import { type SubBudgetRecord } from '../../types/budget';
import { resolveSubBudgetEndDate } from './subBudgetExpenseWindow';
import { isScheduledOneTimeExpense } from '../expenses/scheduled';
import { type DateRange } from '../expenses/periods';
import { shouldShowExpenseOnTimeline } from '../recurrence/filterTimelineVisibleExpenses';
import { listActiveRecurrenceTemplates } from '../recurrence/listActiveRecurrenceTemplates';
import { computeProjectedFutureOccurrenceDates } from '../recurrence/computeProjectedFutureOccurrenceDates';

export interface PeriodBreakdownExpenseGroups {
  actual: Expense[];
  future: Expense[];
}

function isInRange(dateIso: string, range: DateRange): boolean {
  return dateIso >= range.startIso && dateIso <= range.endIso;
}

function cloneProjectedOccurrence(template: Expense, dateIso: string): Expense {
  return {
    ...template,
    id: `${template.id}:${dateIso}`,
    date: dateIso,
    recurrenceSeriesId: template.id,
    recurrenceRule: undefined,
    recurrencePendingBasicFields: undefined,
    scheduled: undefined,
  };
}

function collectStoredExpenses(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
  actual: Expense[],
  future: Expense[],
): void {
  for (const expense of expenses) {
    if (!isInRange(expense.date, range)) continue;

    if (isScheduledOneTimeExpense(expense)) {
      future.push(expense);
      continue;
    }

    if (expense.date > todayIso) {
      future.push(expense);
      continue;
    }

    if (shouldShowExpenseOnTimeline(expense, todayIso)) {
      actual.push(expense);
    }
  }
}

function collectProjectedRecurrences(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
  subBudgets: SubBudgetRecord[],
  future: Expense[],
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

    for (const dateIso of globalProjectedDates) {
      if (!isInRange(dateIso, range)) continue;
      future.push(cloneProjectedOccurrence(template, dateIso));
    }
  }
}

/**
 * Expenses that feed period charts: actual (through today) vs future/planned
 * (stored future, scheduled, and projected recurrences). Same classification as
 * daily expense breakdown totals.
 */
export function collectPeriodBreakdownExpenses(
  expenses: Expense[],
  range: DateRange,
  todayIso: string,
  subBudgets: SubBudgetRecord[] = [],
): PeriodBreakdownExpenseGroups {
  const actual: Expense[] = [];
  const future: Expense[] = [];

  collectStoredExpenses(expenses, range, todayIso, actual, future);
  collectProjectedRecurrences(expenses, range, todayIso, subBudgets, future);

  return { actual, future };
}
