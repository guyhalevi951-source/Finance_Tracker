export const APP_NAME = { en: 'Finance Tracer', he: 'מעקב פיננסי' } as const;
export const APP_TAGLINE = {
  en: 'Track your expenses smartly',
  he: 'עקוב אחר ההוצאות שלך בצורה חכמה',
} as const;
export const PACKAGE_NAME = 'finance-tracer';
export const DEFAULT_LOCALE = 'he' as const;
export const SUPPORTED_LOCALES = ['en', 'he'] as const;
export const LOCALE_STORAGE_KEY = 'locale';

export const THEME_STORAGE_KEY = 'theme';
export const THEMES = ['light', 'dark'] as const;
export type AppTheme = (typeof THEMES)[number];
export const DEFAULT_THEME: AppTheme = 'light';

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
