import { type AppLocale } from '../../config/app';

const DATE_LOCALES: Record<AppLocale, string> = {
  en: 'en-US',
  he: 'he-IL',
};

const WEEKDAY_INITIALS: Record<AppLocale, readonly string[]> = {
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  he: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
};

export function formatDate(date: Date, locale: AppLocale): string {
  return date.toLocaleDateString(DATE_LOCALES[locale], { month: 'long', year: 'numeric' });
}

export function formatDateShort(date: Date, locale: AppLocale): string {
  return date.toLocaleDateString(DATE_LOCALES[locale]);
}

/** Single-letter weekday headers, Sun → Sat. */
export function getWeekdayInitials(locale: AppLocale): readonly string[] {
  return WEEKDAY_INITIALS[locale];
}

export function formatExpenseDateLong(iso: string, locale: AppLocale): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(DATE_LOCALES[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatExpenseDateNumeric(iso: string, locale: AppLocale): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString(DATE_LOCALES[locale]);
}

/** Compact day + month label for week range chips (e.g. "1 Jul – 7 Jul"). */
export function formatWeekRangeLabel(startIso: string, endIso: string, locale: AppLocale): string {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startLabel = start.toLocaleDateString(DATE_LOCALES[locale], opts);
  if (startIso === endIso) return startLabel;
  const endLabel = end.toLocaleDateString(DATE_LOCALES[locale], opts);
  return `${startLabel} – ${endLabel}`;
}

export function formatDayOfMonth(iso: string): number {
  return new Date(`${iso}T00:00:00`).getDate();
}

export function formatCurrencyAmount(amount: number, locale: AppLocale): string {
  return `₪${formatNumber(amount, locale)}`;
}

export function formatNumber(value: number, locale: AppLocale): string {
  return value.toLocaleString(DATE_LOCALES[locale]);
}
