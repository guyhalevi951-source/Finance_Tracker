import { type RecurrenceRule } from '../../types/recurrenceRule';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';
import { computeDueDates } from './computeDueDates';

function addYearsClamped(date: Date, years: number): Date {
  const month = date.getMonth();
  const day = date.getDate();
  const next = new Date(date.getFullYear() + years, month, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

export function computeDefaultSeriesHorizonIso(anchorDateIso: string): string {
  return toIsoDate(addYearsClamped(isoDateToDate(anchorDateIso), 2));
}

/**
 * All occurrence ISO dates for a series: anchor (first) + subsequent due dates.
 * Stops at rule.occurrences, capEndDateIso, or default 2-year horizon (whichever applies first).
 */
export function computeSeriesOccurrenceDates(
  anchorDateIso: string,
  rule: RecurrenceRule,
  options?: { capEndDateIso?: string },
): string[] {
  const cap = options?.capEndDateIso;
  if (cap && anchorDateIso > cap) {
    return [];
  }

  const limit = rule.occurrences;
  const horizon =
    cap ??
    (limit !== null
      ? computeDefaultSeriesHorizonIso(anchorDateIso)
      : computeDefaultSeriesHorizonIso(anchorDateIso));

  const dates: string[] = [anchorDateIso];
  const dueDates = computeDueDates(anchorDateIso, rule, horizon);

  for (const dueDate of dueDates) {
    if (cap && dueDate > cap) break;
    dates.push(dueDate);
    if (limit !== null && dates.length >= limit) break;
  }

  return cap ? dates.filter((dateIso) => dateIso <= cap) : dates;
}
