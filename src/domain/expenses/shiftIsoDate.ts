import { isoDateToDate, toIsoDate } from './parseExpenseDate';

export function dayBeforeIso(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() - 1);
  return toIsoDate(date);
}

export function dayAfterIso(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() + 1);
  return toIsoDate(date);
}
