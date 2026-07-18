import { toIsoDate } from '../../domain/expenses/parseExpenseDate';

export interface CalendarCell {
  iso: string;
  inCurrentMonth: boolean;
}

/**
 * Builds a Sun-starting week grid for the given calendar month.
 * `month` is 0-indexed (0 = January), matching JavaScript Date.
 */
export function buildCalendarGrid(year: number, month: number): CalendarCell[][] {
  const weeks: CalendarCell[][] = [];
  const cursor = new Date(year, month, 1);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  do {
    const week: CalendarCell[] = [];
    for (let day = 0; day < 7; day++) {
      week.push({
        iso: toIsoDate(cursor),
        inCurrentMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  } while (
    cursor.getMonth() === month ||
    (cursor.getDate() <= 7 && cursor.getMonth() === (month + 1) % 12)
  );

  return weeks;
}
