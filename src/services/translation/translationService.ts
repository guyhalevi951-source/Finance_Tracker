import { type AppLocale } from '../../config/app';

export type TranslationLocale = AppLocale;

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';

const LOCALE_CODES: Record<TranslationLocale, string> = {
  en: 'en-US',
  he: 'he-IL',
};

export class TranslationError extends Error {
  constructor(
    message: string,
    public readonly code: 'EMPTY_INPUT' | 'NETWORK_ERROR' | 'API_ERROR' | 'QUOTA_EXCEEDED',
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

/**
 * Translates a string using the MyMemory Translation API.
 * Throws TranslationError on failure — callers decide how to surface the error.
 */
export async function translateText(
  text: string,
  sourceLang: TranslationLocale,
  targetLang: TranslationLocale,
): Promise<string> {
  if (!text.trim()) {
    throw new TranslationError('Input text must not be empty.', 'EMPTY_INPUT');
  }

  const langpair = `${LOCALE_CODES[sourceLang]}|${LOCALE_CODES[targetLang]}`;
  const url = `${MYMEMORY_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new TranslationError(`Network request failed: ${String(e)}`, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    throw new TranslationError(
      `MyMemory API returned HTTP ${response.status}`,
      'NETWORK_ERROR',
    );
  }

  const data = (await response.json()) as {
    responseStatus: number;
    responseDetails?: string;
    responseData: { translatedText: string };
  };

  if (data.responseStatus === 429 || data.responseDetails?.includes('QUERY LENGTH LIMIT')) {
    throw new TranslationError('MyMemory daily quota exceeded.', 'QUOTA_EXCEEDED');
  }

  if (data.responseStatus !== 200) {
    throw new TranslationError(
      `MyMemory API error: ${data.responseDetails ?? String(data.responseStatus)}`,
      'API_ERROR',
    );
  }

  const translated = data.responseData?.translatedText;
  if (!translated) {
    throw new TranslationError('API returned an empty translation.', 'API_ERROR');
  }

  return translated;
}
