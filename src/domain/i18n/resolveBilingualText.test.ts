import { describe, it, expect } from 'vitest';
import { resolveBilingualText } from './resolveBilingualText';
import { buildBilingualText, wrapLegacyText } from './buildBilingualText';

describe('resolveBilingualText', () => {
  it('returns the correct string for the given locale', () => {
    const text = { en: 'Food', he: 'אוכל' };
    expect(resolveBilingualText(text, 'en')).toBe('Food');
    expect(resolveBilingualText(text, 'he')).toBe('אוכל');
  });

  it('falls back to the other language when locale string is empty', () => {
    const text = { en: 'Food', he: '' };
    expect(resolveBilingualText(text, 'he')).toBe('Food');
  });
});

describe('buildBilingualText', () => {
  it('places original in the source locale and translation in the other', () => {
    expect(buildBilingualText('Supermarket', 'en', 'סופר')).toEqual({ en: 'Supermarket', he: 'סופר' });
    expect(buildBilingualText('סופר', 'he', 'Supermarket')).toEqual({ en: 'Supermarket', he: 'סופר' });
  });
});

describe('wrapLegacyText', () => {
  it('places the same string in both locales', () => {
    expect(wrapLegacyText('סופר')).toEqual({ en: 'סופר', he: 'סופר' });
  });
});
