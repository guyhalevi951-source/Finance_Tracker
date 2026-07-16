import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';
import { type RecurrenceRule } from '../../types/recurrenceRule';

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function addYearsClamped(date: Date, years: number): Date {
  const month = date.getMonth();
  const day = date.getDate();
  const next = new Date(date.getFullYear() + years, month, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function computeWeeklyAnchorDueDates(
  anchor: Date,
  through: Date,
  interval: number,
): string[] {
  const dueDates: string[] = [];
  let cursor = addDays(anchor, 7 * interval);
  let guard = 0;

  while (cursor <= through && guard < 5000) {
    guard += 1;
    dueDates.push(toIsoDate(cursor));
    cursor = addDays(cursor, 7 * interval);
  }

  return dueDates;
}

function computeWeeklyCustomDaysDueDates(
  anchor: Date,
  through: Date,
  customDays: number[],
): string[] {
  const dueDates: string[] = [];
  let cursor = addDays(anchor, 1);
  let guard = 0;

  while (cursor <= through && guard < 10000) {
    guard += 1;
    if (customDays.includes(cursor.getDay())) {
      dueDates.push(toIsoDate(cursor));
    }
    cursor = addDays(cursor, 1);
  }

  return dueDates;
}

/**
 * Returns ISO dates for occurrences strictly after anchorDate up to throughIso inclusive.
 */
export function computeDueDates(
  anchorDateIso: string,
  rule: RecurrenceRule,
  throughIso: string,
): string[] {
  if (throughIso <= anchorDateIso) return [];

  const anchor = isoDateToDate(anchorDateIso);
  const through = isoDateToDate(throughIso);

  switch (rule.type) {
    case 'daily': {
      const dueDates: string[] = [];
      let cursor = addDays(anchor, rule.interval);
      let guard = 0;
      while (cursor <= through && guard < 10000) {
        guard += 1;
        dueDates.push(toIsoDate(cursor));
        cursor = addDays(cursor, rule.interval);
      }
      return dueDates;
    }
    case 'weekly': {
      const customDays = rule.customDays ?? [];
      if (customDays.length === 0) {
        return computeWeeklyAnchorDueDates(anchor, through, rule.interval);
      }
      return computeWeeklyCustomDaysDueDates(anchor, through, customDays);
    }
    case 'monthly': {
      const dueDates: string[] = [];
      let cursor = addMonthsClamped(anchor, rule.interval);
      let guard = 0;
      while (cursor <= through && guard < 1000) {
        guard += 1;
        dueDates.push(toIsoDate(cursor));
        cursor = addMonthsClamped(cursor, rule.interval);
      }
      return dueDates;
    }
    case 'yearly': {
      const dueDates: string[] = [];
      let cursor = addYearsClamped(anchor, rule.interval);
      let guard = 0;
      while (cursor <= through && guard < 500) {
        guard += 1;
        dueDates.push(toIsoDate(cursor));
        cursor = addYearsClamped(cursor, rule.interval);
      }
      return dueDates;
    }
    default:
      return [];
  }
}
