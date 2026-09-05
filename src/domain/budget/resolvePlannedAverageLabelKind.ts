import { getMonthBounds, type DateRange } from '../expenses/periods';
import { isoDateToDate } from '../expenses/parseExpenseDate';

export type PlannedAverageLabelKind = 'monthly' | 'inclusive';

/**
 * Planned daily-average subtitle: master and exact calendar-month windows are monthly;
 * shorter or partial sub-budget windows are inclusive.
 */
export function resolvePlannedAverageLabelKind(
  isMaster: boolean,
  range: DateRange,
): PlannedAverageLabelKind {
  if (isMaster) return 'monthly';

  const start = isoDateToDate(range.startIso);
  const monthBounds = getMonthBounds(start.getFullYear(), start.getMonth());
  if (range.startIso === monthBounds.startIso && range.endIso === monthBounds.endIso) {
    return 'monthly';
  }

  return 'inclusive';
}
