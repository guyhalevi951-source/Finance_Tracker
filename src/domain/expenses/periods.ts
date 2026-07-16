import { type Expense } from '../../types/expense';
import { isoDateToDate, toIsoDate } from './parseExpenseDate';

export type TimeGranularity = 'monthly' | 'weekly' | 'daily';

export interface DateRange {
  startIso: string;
  endIso: string;
}

export interface MonthWeekRange {
  startIso: string;
  endIso: string;
  index: number;
}

export interface ExpenseTimeFilterState {
  year: number;
  /** 0-indexed month (January = 0) */
  month: number;
  granularity: TimeGranularity;
  selectedWeekIndex: number | null;
  selectedDayIso: string | null;
}

export function getMonthBounds(year: number, month: number): DateRange {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { startIso: toIsoDate(start), endIso: toIsoDate(end) };
}

/** Strict 7-day chunks from the 1st of the month (1–7, 8–14, …). */
export function getMonthWeekRanges(year: number, month: number): MonthWeekRange[] {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const weeks: MonthWeekRange[] = [];

  for (let startDay = 1; startDay <= lastDay; startDay += 7) {
    const endDay = Math.min(startDay + 6, lastDay);
    weeks.push({
      startIso: toIsoDate(new Date(year, month, startDay)),
      endIso: toIsoDate(new Date(year, month, endDay)),
      index: weeks.length,
    });
  }

  return weeks;
}

export function getMonthDayIsos(year: number, month: number): string[] {
  const days: string[] = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day++) {
    days.push(toIsoDate(new Date(year, month, day)));
  }
  return days;
}

export function isDateInRange(iso: string, range: DateRange): boolean {
  return iso >= range.startIso && iso <= range.endIso;
}

export function filterExpensesByPeriod(expenses: Expense[], range: DateRange): Expense[] {
  return expenses.filter((expense) => isDateInRange(expense.date, range));
}

export function getDefaultWeekIndex(
  year: number,
  month: number,
  referenceDate: Date = new Date(),
): number {
  const weeks = getMonthWeekRanges(year, month);
  if (weeks.length === 0) return 0;

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  if (refYear !== year || refMonth !== month) return 0;

  const todayIso = toIsoDate(referenceDate);
  const index = weeks.findIndex((week) => isDateInRange(todayIso, week));
  return index >= 0 ? index : 0;
}

export function getDefaultDayIso(
  year: number,
  month: number,
  referenceDate: Date = new Date(),
): string {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  if (refYear === year && refMonth === month) {
    return toIsoDate(referenceDate);
  }
  return toIsoDate(new Date(year, month, 1));
}

export function resolveExpenseTimeRange(state: ExpenseTimeFilterState): DateRange {
  const { year, month, granularity, selectedWeekIndex, selectedDayIso } = state;

  if (granularity === 'monthly') {
    return getMonthBounds(year, month);
  }

  if (granularity === 'weekly') {
    const weeks = getMonthWeekRanges(year, month);
    const index = selectedWeekIndex ?? 0;
    const week = weeks[index] ?? weeks[0];
    if (!week) return getMonthBounds(year, month);
    return { startIso: week.startIso, endIso: week.endIso };
  }

  const dayIso = selectedDayIso ?? getDefaultDayIso(year, month);
  return { startIso: dayIso, endIso: dayIso };
}

export function firstOfMonthDate(year: number, month: number): Date {
  return isoDateToDate(getMonthBounds(year, month).startIso);
}
