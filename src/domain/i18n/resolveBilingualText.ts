import { type BilingualText } from '../../types/bilingual';
import { type AppLocale } from '../../config/app';

/**
 * Returns the display string for a BilingualText in the current locale.
 * If the locale-specific string is empty, falls back to the other language.
 */
export function resolveBilingualText(text: BilingualText, locale: AppLocale): string {
  return text[locale] || text[locale === 'en' ? 'he' : 'en'];
}
