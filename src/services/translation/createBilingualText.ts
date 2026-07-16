import { type BilingualText } from '../../types/bilingual';
import { type TranslationLocale, translateText } from './translationService';
import { buildBilingualText, EMPTY_BILINGUAL_TEXT } from '../../domain/i18n/buildBilingualText';

/**
 * Translates `original` into the opposite language and returns a BilingualText.
 * This is the single approved entry point for creating user-content BilingualText via the API.
 */
export async function createBilingualText(
  original: string,
  sourceLang: TranslationLocale,
): Promise<BilingualText> {
  if (original.trim() === '') return EMPTY_BILINGUAL_TEXT;

  const targetLang: TranslationLocale = sourceLang === 'en' ? 'he' : 'en';
  const translated = await translateText(original, sourceLang, targetLang);
  return buildBilingualText(original, sourceLang, translated);
}
