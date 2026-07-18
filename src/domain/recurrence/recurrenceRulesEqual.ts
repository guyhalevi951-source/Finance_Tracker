import { type RecurrenceRule } from '../../types/recurrenceRule';

export function recurrenceRulesEqual(
  a: RecurrenceRule | null,
  b: RecurrenceRule | null,
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;

  return (
    a.type === b.type &&
    a.interval === b.interval &&
    a.occurrences === b.occurrences &&
    JSON.stringify(a.customDays ?? []) === JSON.stringify(b.customDays ?? [])
  );
}
