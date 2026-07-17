export const RECURRENCE_TYPES = ['daily', 'weekly', 'monthly', 'yearly'] as const;

export type RecurrenceType = (typeof RECURRENCE_TYPES)[number];

export type OccurrencesLimitPreset = 'unlimited' | '2' | '3' | '4' | '5' | 'custom';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval: number;
  customDays?: number[];
  /** Max total instances in series (template + generated). null = unlimited */
  occurrences: number | null;
}

export const RECURRENCE_PRESET_IDS = [
  'never',
  'daily',
  'weekly',
  'weekday',
  'weekend',
  'monthly',
  'yearly',
  'custom',
] as const;

export type RecurrencePresetId = (typeof RECURRENCE_PRESET_IDS)[number];

export type RecurrenceCustomMode = 'intervalDays' | 'weekdays';

export interface RecurrenceSelection {
  preset: RecurrencePresetId;
  customMode?: RecurrenceCustomMode;
  customIntervalDays?: number;
  customWeekdays?: number[];
  occurrencesLimit?: OccurrencesLimitPreset;
  customOccurrences?: number;
}

export const DEFAULT_RECURRENCE_SELECTION: RecurrenceSelection = { preset: 'never' };
