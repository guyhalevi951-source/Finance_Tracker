import { describe, it, expect } from 'vitest';
import { isIsoDateString, parseExpenseDateToIso, resolveIsoDateOrToday, toIsoDate } from './parseExpenseDate';

describe('parseExpenseDateToIso', () => {
  it('passes through valid ISO dates', () => {
    expect(parseExpenseDateToIso('2026-07-10')).toBe('2026-07-10');
  });

  it('migrates legacy localized date strings', () => {
    const result = parseExpenseDateToIso('7/10/2026');
    expect(isIsoDateString(result)).toBe(true);
  });
});

describe('resolveIsoDateOrToday', () => {
  it('returns the same string for valid ISO input', () => {
    expect(resolveIsoDateOrToday('2026-07-10')).toBe('2026-07-10');
  });

  it('falls back to today for empty or invalid input', () => {
    const today = toIsoDate(new Date());
    expect(resolveIsoDateOrToday('')).toBe(today);
    expect(resolveIsoDateOrToday('NaN-NaN-NaN')).toBe(today);
    expect(resolveIsoDateOrToday('not-a-date')).toBe(today);
  });
});
describe('isIsoDateString', () => {
  it('rejects invalid formats', () => {
    expect(isIsoDateString('10/07/2026')).toBe(false);
    expect(isIsoDateString('2026-13-01')).toBe(false);
  });
});
