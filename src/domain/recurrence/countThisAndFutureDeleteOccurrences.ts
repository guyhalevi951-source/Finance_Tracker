import { type Expense } from '../../types/expense';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';
import { canGenerateOccurrence } from './canGenerateOccurrence';
import { computeDueDates } from './computeDueDates';
import { countConsumedSeriesOccurrences } from './countSeriesOccurrences';
import { isRecurrenceDateExcluded } from './isRecurrenceDateExcluded';
import { resolveSeriesTemplate } from './resolveSeriesTemplate';

function addYearsClamped(date: Date, years: number): Date {
  const month = date.getMonth();
  const day = date.getDate();
  const next = new Date(date.getFullYear() + years, month, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function computeHorizonIso(fromIso: string, recurrenceEndDate?: string): string {
  if (recurrenceEndDate && recurrenceEndDate >= fromIso) {
    return recurrenceEndDate;
  }
  return toIsoDate(addYearsClamped(isoDateToDate(fromIso), 2));
}

function resolveSeriesTemplateForCount(
  expenses: Expense[],
  target: Expense,
  isTemplate: boolean,
): Expense | undefined {
  if (isTemplate) {
    return target;
  }
  return resolveSeriesTemplate(expenses, target);
}

function countMaterializedThisAndFuture(
  expenses: Expense[],
  target: Expense,
  rootId: string,
): number {
  const splitDate = target.date;

  // Include every same-series row on/after the split — including instances past
  // recurrenceEndDate. End dates stop *projection*/generation; already-materialized
  // siblings must still cascade on delete (otherwise the absolute last orphan is skipped).
  return expenses.filter((expense) => {
    return (
      expense.id === target.id ||
      (expense.recurrenceSeriesId === rootId && expense.date >= splitDate)
    );
  }).length;
}

function countProjectedThisAndFuture(
  expenses: Expense[],
  template: Expense,
  rootId: string,
  splitDate: string,
  todayIso: string,
): number {
  const rule = template.recurrenceRule;
  if (!rule) {
    return 0;
  }

  const existingDates = new Set(
    expenses
      .filter((expense) => expense.id === rootId || expense.recurrenceSeriesId === rootId)
      .map((expense) => expense.date),
  );

  const projectionStart = splitDate > todayIso ? splitDate : todayIso;
  const horizonIso = computeHorizonIso(projectionStart, template.recurrenceEndDate);
  const dueDates = computeDueDates(template.date, rule, horizonIso).filter(
    (dueDate) => dueDate >= projectionStart,
  );

  const consumedCount = countConsumedSeriesOccurrences(expenses, template);
  let projected = 0;

  for (const dueDate of dueDates) {
    if (template.recurrenceEndDate && dueDate > template.recurrenceEndDate) {
      break;
    }
    if (isRecurrenceDateExcluded(template, dueDate)) {
      continue;
    }
    if (existingDates.has(dueDate)) {
      continue;
    }
    if (!canGenerateOccurrence(rule.occurrences, consumedCount, projected)) {
      break;
    }
    projected += 1;
  }

  return projected;
}

export function countThisAndFutureDeleteOccurrences(
  expenses: Expense[],
  target: Expense,
  todayIso: string,
): number {
  const isTemplate = target.recurrenceRule !== undefined;
  const rootId = isTemplate ? target.id : target.recurrenceSeriesId;

  if (!rootId) {
    return 1;
  }

  const template = resolveSeriesTemplateForCount(expenses, target, isTemplate);
  const recurrenceEndDate = template?.recurrenceEndDate;
  const materialized = countMaterializedThisAndFuture(expenses, target, rootId);

  if (recurrenceEndDate && recurrenceEndDate < target.date) {
    return materialized;
  }

  if (!template?.recurrenceRule) {
    return materialized;
  }

  const projected = countProjectedThisAndFuture(
    expenses,
    template,
    rootId,
    target.date,
    todayIso,
  );

  return materialized + projected;
}
