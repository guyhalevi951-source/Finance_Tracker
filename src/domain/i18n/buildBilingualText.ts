import { type BilingualText } from '../../types/bilingual';
import { type AppLocale } from '../../config/app';

export const EMPTY_BILINGUAL_TEXT: BilingualText = { en: '', he: '' };

export function hasBilingualTextContent(text: BilingualText): boolean {
  return text.en.trim() !== '' || text.he.trim() !== '';
}

/**
 * Pure helper: pairs an original string with its translation to form a BilingualText.
 * Does not make any API calls — translation must be provided by the caller.
 */
export function buildBilingualText(
  original: string,
  sourceLang: AppLocale,
  translated: string,
): BilingualText {
  if (sourceLang === 'en') {
    return { en: original, he: translated };
  }
  return { en: translated, he: original };
}

/**
 * Wraps a legacy plain string as a BilingualText with the same value in both languages.
 * Used for data migration of old expenses that stored description as a plain string.
 */
export function wrapLegacyText(text: string): BilingualText {
  return { en: text, he: text };
}
