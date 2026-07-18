import { type Expense } from '../../types/expense';
import { canGenerateOccurrence } from './canGenerateOccurrence';
import { computeDueDates } from './computeDueDates';
import { countConsumedSeriesOccurrences } from './countSeriesOccurrences';
import { isRecurrenceDateExcluded } from './isRecurrenceDateExcluded';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';

function addYearsClamped(date: Date, years: number): Date {
  const month = date.getMonth();
  const day = date.getDate();
  const next = new Date(date.getFullYear() + years, month, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function computeHorizonIso(todayIso: string, recurrenceEndDate?: string): string {
  if (recurrenceEndDate && recurrenceEndDate > todayIso) {
    return recurrenceEndDate;
  }
  return toIsoDate(addYearsClamped(isoDateToDate(todayIso), 2));
}

function hasGeneratableFutureDueDate(
  template: Expense,
  todayIso: string,
  horizonIso: string,
): boolean {
  const rule = template.recurrenceRule;
  if (!rule) return false;

  const dueDates = computeDueDates(template.date, rule, horizonIso);

  return dueDates.some((dueDate) => {
    if (dueDate < todayIso) return false;
    if (template.recurrenceEndDate && dueDate > template.recurrenceEndDate) return false;
    if (isRecurrenceDateExcluded(template, dueDate)) return false;
    return true;
  });
}

export function isActiveRecurrenceTemplate(
  template: Expense,
  expenses: Expense[],
  todayIso: string,
): boolean {
  const rule = template.recurrenceRule;
  if (!rule) return false;

  if (template.recurrenceEndDate && todayIso > template.recurrenceEndDate) {
    return false;
  }

  const currentCount = countConsumedSeriesOccurrences(expenses, template);
  if (!canGenerateOccurrence(rule.occurrences, currentCount, 0)) {
    return false;
  }

  const horizonIso = computeHorizonIso(todayIso, template.recurrenceEndDate);
  return hasGeneratableFutureDueDate(template, todayIso, horizonIso);
}
