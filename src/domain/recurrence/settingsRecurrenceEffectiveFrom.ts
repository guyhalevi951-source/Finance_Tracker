import { dayAfterIso } from '../expenses/shiftIsoDate';

/**
 * Profile Settings recurring edits apply strictly after today:
 * instance_date > todayIso ⇔ effectiveFrom = tomorrow.
 */
export function settingsRecurrenceEffectiveFromIso(todayIso: string): string {
  return dayAfterIso(todayIso);
}
