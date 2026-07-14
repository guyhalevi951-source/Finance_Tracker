import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import he from './locales/he.json';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type AppLocale } from '../config/app';

const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as AppLocale | null;
const initialLocale: AppLocale = savedLocale === 'en' || savedLocale === 'he'
  ? savedLocale
  : DEFAULT_LOCALE;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    lng: initialLocale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: {
      escapeValue: false,
    },
  });

export function changeLanguage(locale: AppLocale): void {
  i18n.changeLanguage(locale);
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export default i18n;
