import { type Expense } from '../../types/expense';

export function isRecurrenceDateExcluded(template: Expense, dateIso: string): boolean {
  return template.recurrenceExcludedDates?.includes(dateIso) ?? false;
}

export function mergeExcludedDates(
  existing: string[] | undefined,
  dateIso: string,
): string[] {
  const merged = existing ? [...existing] : [];
  if (!merged.includes(dateIso)) {
    merged.push(dateIso);
  }
  return merged;
}
