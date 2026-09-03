import { type Expense } from '../../types/expense';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';
import {
  buildExistingOccurrenceKey,
  collectExistingOccurrenceKeys,
} from './buildGeneratedExpense';
import { computeDueDates } from './computeDueDates';
import { countConsumedSeriesOccurrences } from './countSeriesOccurrences';
import { earliestEndDate } from './earliestEndDate';
import { isRecurrenceDateExcluded } from './isRecurrenceDateExcluded';
import { computeRemainingOccurrences } from './occurrencesRemaining';

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

/** Chronological future occurrence dates for one template, capped by global remaining count. */
export function computeProjectedFutureOccurrenceDates(
  expenses: Expense[],
  template: Expense,
  todayIso: string,
  capEndDateIso?: string,
): string[] {
  const rule = template.recurrenceRule;
  if (!rule) {
    return [];
  }

  const currentCount = countConsumedSeriesOccurrences(expenses, template);
  const remainingSlots = computeRemainingOccurrences(rule.occurrences, currentCount);
  if (remainingSlots === 0) {
    return [];
  }

  const effectiveEndDate = capEndDateIso
    ? earliestEndDate(template.recurrenceEndDate, capEndDateIso)
    : template.recurrenceEndDate;
  const horizonIso = computeHorizonIso(todayIso, effectiveEndDate);
  if (horizonIso <= todayIso) {
    return [];
  }

  const existingKeys = collectExistingOccurrenceKeys(expenses);
  const dueDates = computeDueDates(template.date, rule, horizonIso).filter(
    (dateIso) => dateIso > todayIso,
  );

  const projectedDates: string[] = [];

  for (const dateIso of dueDates) {
    if (remainingSlots !== null && projectedDates.length >= remainingSlots) {
      break;
    }
    if (effectiveEndDate && dateIso > effectiveEndDate) {
      break;
    }
    if (isRecurrenceDateExcluded(template, dateIso)) {
      continue;
    }
    if (existingKeys.has(buildExistingOccurrenceKey(template.id, dateIso))) {
      continue;
    }
    projectedDates.push(dateIso);
  }

  return projectedDates;
}
