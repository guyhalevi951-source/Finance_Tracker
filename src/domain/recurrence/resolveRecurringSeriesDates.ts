import { type Expense } from '../../types/expense';
import { computeDueDates } from './computeDueDates';
import { computeDefaultSeriesHorizonIso, computeSeriesOccurrenceDates } from './computeSeriesOccurrenceDates';
import { isRecurrenceDateExcluded } from './isRecurrenceDateExcluded';

export interface RecurringSeriesDateInfo {
  startDateIso: string;
  nextOccurrenceDateIso: string | null;
  endDateIso: string | null;
}

function resolveSeriesEndDateIso(template: Expense): string | null {
  if (template.recurrenceEndDate) {
    return template.recurrenceEndDate;
  }
  const rule = template.recurrenceRule;
  if (!rule || rule.occurrences === null) {
    return null;
  }
  const dates = computeSeriesOccurrenceDates(template.date, rule);
  return dates.length > 0 ? dates[dates.length - 1]! : null;
}

export function resolveNextOccurrenceDateIso(
  template: Expense,
  todayIso: string,
): string | null {
  const rule = template.recurrenceRule;
  if (!rule) return null;

  const endDate = resolveSeriesEndDateIso(template);
  const horizon = endDate ?? computeDefaultSeriesHorizonIso(todayIso);

  if (
    template.date >= todayIso &&
    (!endDate || template.date <= endDate) &&
    !isRecurrenceDateExcluded(template, template.date)
  ) {
    return template.date;
  }

  const dueDates = computeDueDates(template.date, rule, horizon).filter(
    (dateIso) => dateIso >= todayIso,
  );

  for (const dateIso of dueDates) {
    if (endDate && dateIso > endDate) break;
    if (!isRecurrenceDateExcluded(template, dateIso)) {
      return dateIso;
    }
  }

  return null;
}

export function resolveRecurringSeriesDateInfo(
  template: Expense,
  todayIso: string,
): RecurringSeriesDateInfo {
  return {
    startDateIso: template.date,
    nextOccurrenceDateIso: resolveNextOccurrenceDateIso(template, todayIso),
    endDateIso: resolveSeriesEndDateIso(template),
  };
}
