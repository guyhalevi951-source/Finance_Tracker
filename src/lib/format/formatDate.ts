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

export function formatCurrencyAmount(amount: number, locale: AppLocale): string {
  return `₪${formatNumber(amount, locale)}`;
}

export function formatNumber(value: number, locale: AppLocale): string {
  return value.toLocaleString(DATE_LOCALES[locale]);
}
