import { type Expense } from '../../types/expense';
import { computeSeriesOccurrenceDates } from './computeSeriesOccurrenceDates';

export type FinalizeRecurrenceScheduleError =
  | 'START_AFTER_BUDGET_END'
  | 'RECURRENCE_EXCEEDS_BUDGET';

export type FinalizeRecurrenceScheduleResult =
  | { ok: true; expense: Expense }
  | { ok: false; error: FinalizeRecurrenceScheduleError };

/**
 * Stamps recurrenceEndDate (and adjusts rule.occurrences when capped) from the
 * computed occurrence date array. Used on create/edit and sub-budget hard-stop.
 */
export function finalizeRecurrenceSchedule(
  expense: Expense,
  options?: { capEndDateIso?: string; forceFinite?: boolean },
): FinalizeRecurrenceScheduleResult {
  const rule = expense.recurrenceRule;
  if (!rule) {
    return { ok: true, expense };
  }

  const cap = options?.capEndDateIso;
  if (cap && expense.date > cap) {
    return { ok: false, error: 'START_AFTER_BUDGET_END' };
  }

  const isUnlimited = rule.occurrences === null;
  if (isUnlimited && !cap && !options?.forceFinite) {
    return { ok: true, expense };
  }

  const dates = computeSeriesOccurrenceDates(expense.date, rule, { capEndDateIso: cap });
  if (dates.length === 0) {
    return { ok: false, error: 'RECURRENCE_EXCEEDS_BUDGET' };
  }

  const lastDate = dates[dates.length - 1]!;
  const adjustedRule =
    cap || !isUnlimited
      ? { ...rule, occurrences: dates.length }
      : rule;

  return {
    ok: true,
    expense: {
      ...expense,
      recurrenceRule: adjustedRule,
      recurrenceEndDate: lastDate,
    },
  };
}
