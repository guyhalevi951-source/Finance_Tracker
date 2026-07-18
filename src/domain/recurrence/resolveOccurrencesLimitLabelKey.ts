import {
  type OccurrencesLimitPreset,
  type RecurrenceSelection,
} from '../../types/recurrenceRule';
import { isRecurrenceActive } from './resolveRecurrenceLabelKey';

export interface OccurrencesLimitLabelDescriptor {
  key: string;
  params?: Record<string, string | number>;
  /** Raw literal for digit presets — no i18n lookup needed. */
  literal?: string;
}

export function resolveOccurrencesLimitLabelDescriptor(
  selection: RecurrenceSelection,
): OccurrencesLimitLabelDescriptor | null {
  if (!isRecurrenceActive(selection)) {
    return null;
  }

  const limit: OccurrencesLimitPreset = selection.occurrencesLimit ?? 'unlimited';

  if (limit === 'unlimited') {
    return { key: 'addExpense.recurrence.occurrencesUnlimited' };
  }

  if (limit === 'custom') {
    const count = selection.customOccurrences ?? 2;
    return { literal: String(count) };
  }

  return { literal: limit };
}

export function resolveOccurrencesLimitChipLabelDescriptor(
  preset: OccurrencesLimitPreset,
): OccurrencesLimitLabelDescriptor {
  if (preset === 'unlimited') {
    return { key: 'addExpense.recurrence.occurrencesUnlimited' };
  }

  if (preset === 'custom') {
    return { key: 'addExpense.recurrence.occurrencesCustom' };
  }

  return { literal: preset };
}
