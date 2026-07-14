import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateText, TranslationError } from './translationService';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

function makeApiResponse(translatedText: string, status = 200) {
  return {
    responseStatus: status,
    responseData: { translatedText },
  };
}

describe('translateText', () => {
  it('returns translated text on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse('Supermarket'),
    });

    const result = await translateText('סופר', 'he', 'en');
    expect(result).toBe('Supermarket');
  });

  it('throws EMPTY_INPUT for blank strings', async () => {
    await expect(translateText('   ', 'en', 'he')).rejects.toMatchObject({
      code: 'EMPTY_INPUT',
    });
  });

  it('throws NETWORK_ERROR when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('connection refused'));
    await expect(translateText('food', 'en', 'he')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('throws NETWORK_ERROR on non-200 HTTP status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(translateText('food', 'en', 'he')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('throws QUOTA_EXCEEDED when API returns status 429', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseStatus: 429, responseData: { translatedText: '' } }),
    });
    await expect(translateText('food', 'en', 'he')).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
    });
  });

  it('throws API_ERROR when API returns non-200 responseStatus', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ responseStatus: 500, responseDetails: 'Internal error', responseData: { translatedText: '' } }),
    });
    await expect(translateText('food', 'en', 'he')).rejects.toBeInstanceOf(TranslationError);
  });

  it('encodes the langpair using he-IL and en-US locale codes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse('אוכל'),
    });

    await translateText('food', 'en', 'he');

    const calledUrl: string = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('langpair=en-US%7Che-IL');
  });
});
