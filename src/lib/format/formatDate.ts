import { type AppLocale } from '../../config/app';

const DATE_LOCALES: Record<AppLocale, string> = {
  en: 'en-US',
  he: 'he-IL',
};

export function formatDate(date: Date, locale: AppLocale): string {
  return date.toLocaleDateString(DATE_LOCALES[locale], { month: 'long', year: 'numeric' });
}

export function formatDateShort(date: Date, locale: AppLocale): string {
  return date.toLocaleDateString(DATE_LOCALES[locale]);
}

export function formatNumber(value: number, locale: AppLocale): string {
  return value.toLocaleString(DATE_LOCALES[locale]);
}
