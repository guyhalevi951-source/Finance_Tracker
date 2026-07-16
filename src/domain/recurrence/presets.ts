import {
  type RecurrencePresetId,
  type RecurrenceRule,
  type RecurrenceSelection,
} from '../../types/recurrenceRule';

/** Israeli work week: Sun–Thu */
export const WEEKDAY_DAYS = [0, 1, 2, 3, 4] as const;

/** Israeli weekend: Fri–Sat */
export const WEEKEND_DAYS = [5, 6] as const;

export function selectionToRule(selection: RecurrenceSelection): RecurrenceRule | null {
  switch (selection.preset) {
    case 'never':
      return null;
    case 'daily':
      return { type: 'daily', interval: 1 };
    case 'weekly':
      return { type: 'weekly', interval: 1, customDays: [] };
    case 'weekday':
      return { type: 'weekly', interval: 1, customDays: [...WEEKDAY_DAYS] };
    case 'weekend':
      return { type: 'weekly', interval: 1, customDays: [...WEEKEND_DAYS] };
    case 'monthly':
      return { type: 'monthly', interval: 1 };
    case 'yearly':
      return { type: 'yearly', interval: 1 };
    case 'custom':
      if (selection.customMode === 'intervalDays') {
        return { type: 'daily', interval: selection.customIntervalDays ?? 1 };
      }
      return {
        type: 'weekly',
        interval: 1,
        customDays: [...(selection.customWeekdays ?? [])],
      };
    default:
      return null;
  }
}

export function ruleToSelection(rule: RecurrenceRule): RecurrenceSelection {
  if (rule.type === 'daily' && rule.interval !== 1) {
    return {
      preset: 'custom',
      customMode: 'intervalDays',
      customIntervalDays: rule.interval,
    };
  }

  if (rule.type === 'daily' && rule.interval === 1) {
    return { preset: 'daily' };
  }

  if (rule.type === 'weekly') {
    const days = rule.customDays ?? [];
    if (
      days.length === WEEKDAY_DAYS.length &&
      WEEKDAY_DAYS.every((d) => days.includes(d))
    ) {
      return { preset: 'weekday' };
    }
    if (
      days.length === WEEKEND_DAYS.length &&
      WEEKEND_DAYS.every((d) => days.includes(d))
    ) {
      return { preset: 'weekend' };
    }
    if (days.length === 0 && rule.interval === 1) {
      return { preset: 'weekly' };
    }
    return {
      preset: 'custom',
      customMode: 'weekdays',
      customWeekdays: [...days],
    };
  }

  if (rule.type === 'monthly' && rule.interval === 1) {
    return { preset: 'monthly' };
  }

  if (rule.type === 'yearly' && rule.interval === 1) {
    return { preset: 'yearly' };
  }

  return {
    preset: 'custom',
    customMode: rule.type === 'daily' ? 'intervalDays' : 'weekdays',
    customIntervalDays: rule.type === 'daily' ? rule.interval : undefined,
    customWeekdays: rule.type === 'weekly' ? [...(rule.customDays ?? [])] : undefined,
  };
}

export function isRecurrencePresetId(value: string): value is RecurrencePresetId {
  return (
    value === 'never' ||
    value === 'daily' ||
    value === 'weekly' ||
    value === 'weekday' ||
    value === 'weekend' ||
    value === 'monthly' ||
    value === 'yearly' ||
    value === 'custom'
  );
}
