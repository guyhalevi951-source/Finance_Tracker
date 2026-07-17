import {
  type OccurrencesLimitPreset,
  type RecurrencePresetId,
  type RecurrenceRule,
  type RecurrenceSelection,
} from '../../types/recurrenceRule';

/** Israeli work week: Sun–Thu */
export const WEEKDAY_DAYS = [0, 1, 2, 3, 4] as const;

/** Israeli weekend: Fri–Sat */
export const WEEKEND_DAYS = [5, 6] as const;

export function resolveOccurrencesFromSelection(selection: RecurrenceSelection): number | null {
  const limit = selection.occurrencesLimit ?? 'unlimited';
  if (limit === 'unlimited') {
    return null;
  }
  if (limit === 'custom') {
    return selection.customOccurrences ?? null;
  }
  return Number.parseInt(limit, 10);
}

function occurrencesToSelectionFields(
  occurrences: number | null,
): Pick<RecurrenceSelection, 'occurrencesLimit' | 'customOccurrences'> {
  if (occurrences === null) {
    return { occurrencesLimit: 'unlimited' };
  }

  if (occurrences >= 2 && occurrences <= 5) {
    return { occurrencesLimit: String(occurrences) as OccurrencesLimitPreset };
  }

  return {
    occurrencesLimit: 'custom',
    customOccurrences: occurrences,
  };
}

function withOccurrences(selection: RecurrenceSelection, rule: RecurrenceRule): RecurrenceRule {
  return {
    ...rule,
    occurrences: resolveOccurrencesFromSelection(selection),
  };
}

export function selectionToRule(selection: RecurrenceSelection): RecurrenceRule | null {
  switch (selection.preset) {
    case 'never':
      return null;
    case 'daily':
      return withOccurrences(selection, { type: 'daily', interval: 1, occurrences: null });
    case 'weekly':
      return withOccurrences(selection, {
        type: 'weekly',
        interval: 1,
        customDays: [],
        occurrences: null,
      });
    case 'weekday':
      return withOccurrences(selection, {
        type: 'weekly',
        interval: 1,
        customDays: [...WEEKDAY_DAYS],
        occurrences: null,
      });
    case 'weekend':
      return withOccurrences(selection, {
        type: 'weekly',
        interval: 1,
        customDays: [...WEEKEND_DAYS],
        occurrences: null,
      });
    case 'monthly':
      return withOccurrences(selection, { type: 'monthly', interval: 1, occurrences: null });
    case 'yearly':
      return withOccurrences(selection, { type: 'yearly', interval: 1, occurrences: null });
    case 'custom':
      if (selection.customMode === 'intervalDays') {
        return withOccurrences(selection, {
          type: 'daily',
          interval: selection.customIntervalDays ?? 1,
          occurrences: null,
        });
      }
      return withOccurrences(selection, {
        type: 'weekly',
        interval: 1,
        customDays: [...(selection.customWeekdays ?? [])],
        occurrences: null,
      });
    default:
      return null;
  }
}

export function ruleToSelection(rule: RecurrenceRule): RecurrenceSelection {
  const occurrenceFields = occurrencesToSelectionFields(rule.occurrences);
  let base: RecurrenceSelection;

  if (rule.type === 'daily' && rule.interval !== 1) {
    base = {
      preset: 'custom',
      customMode: 'intervalDays',
      customIntervalDays: rule.interval,
    };
  } else if (rule.type === 'daily' && rule.interval === 1) {
    base = { preset: 'daily' };
  } else if (rule.type === 'weekly') {
    const days = rule.customDays ?? [];
    if (
      days.length === WEEKDAY_DAYS.length &&
      WEEKDAY_DAYS.every((d) => days.includes(d))
    ) {
      base = { preset: 'weekday' };
    } else if (
      days.length === WEEKEND_DAYS.length &&
      WEEKEND_DAYS.every((d) => days.includes(d))
    ) {
      base = { preset: 'weekend' };
    } else if (days.length === 0 && rule.interval === 1) {
      base = { preset: 'weekly' };
    } else {
      base = {
        preset: 'custom',
        customMode: 'weekdays',
        customWeekdays: [...days],
      };
    }
  } else if (rule.type === 'monthly' && rule.interval === 1) {
    base = { preset: 'monthly' };
  } else if (rule.type === 'yearly' && rule.interval === 1) {
    base = { preset: 'yearly' };
  } else {
    base = {
      preset: 'custom',
      customMode: rule.type === 'daily' ? 'intervalDays' : 'weekdays',
      customIntervalDays: rule.type === 'daily' ? rule.interval : undefined,
      customWeekdays: rule.type === 'weekly' ? [...(rule.customDays ?? [])] : undefined,
    };
  }

  return { ...base, ...occurrenceFields };
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
