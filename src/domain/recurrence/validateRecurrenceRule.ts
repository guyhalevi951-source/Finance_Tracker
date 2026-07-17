import { RECURRENCE_TYPES, type RecurrenceRule, type RecurrenceSelection } from '../../types/recurrenceRule';
import { selectionToRule } from './presets';

export type RecurrenceValidationError =
  | 'RECURRENCE_INTERVAL_INVALID'
  | 'RECURRENCE_WEEKDAYS_EMPTY'
  | 'RECURRENCE_TYPE_INVALID'
  | 'RECURRENCE_OCCURRENCES_INVALID';

function isValidWeekday(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

function isValidOccurrences(value: number | null): boolean {
  return value === null || (Number.isInteger(value) && value >= 2);
}

export function validateRecurrenceRule(
  rule: RecurrenceRule,
): RecurrenceValidationError | null {
  if (!RECURRENCE_TYPES.includes(rule.type)) {
    return 'RECURRENCE_TYPE_INVALID';
  }

  if (!Number.isInteger(rule.interval) || rule.interval < 1) {
    return 'RECURRENCE_INTERVAL_INVALID';
  }

  if (!isValidOccurrences(rule.occurrences)) {
    return 'RECURRENCE_OCCURRENCES_INVALID';
  }

  if (rule.type === 'weekly' && rule.customDays !== undefined) {
    if (rule.customDays.length === 0) {
      return null;
    }
    if (!rule.customDays.every(isValidWeekday)) {
      return 'RECURRENCE_WEEKDAYS_EMPTY';
    }
  }

  return null;
}

export function validateRecurrenceSelection(
  selection: RecurrenceSelection,
): RecurrenceValidationError | null {
  if (selection.preset === 'never') return null;

  const limit = selection.occurrencesLimit ?? 'unlimited';
  if (limit === 'custom') {
    const occurrences = selection.customOccurrences ?? 0;
    if (!Number.isInteger(occurrences) || occurrences < 2) {
      return 'RECURRENCE_OCCURRENCES_INVALID';
    }
  }

  if (selection.preset === 'custom') {
    if (selection.customMode === 'intervalDays') {
      const interval = selection.customIntervalDays ?? 0;
      if (!Number.isInteger(interval) || interval < 1) {
        return 'RECURRENCE_INTERVAL_INVALID';
      }
    } else if (selection.customMode === 'weekdays') {
      const days = selection.customWeekdays ?? [];
      if (days.length === 0 || !days.every(isValidWeekday)) {
        return 'RECURRENCE_WEEKDAYS_EMPTY';
      }
    } else {
      return 'RECURRENCE_WEEKDAYS_EMPTY';
    }
  }

  const rule = selectionToRule(selection);
  if (!rule) return null;
  return validateRecurrenceRule(rule);
}
