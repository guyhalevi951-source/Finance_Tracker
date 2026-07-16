import { describe, it, expect } from 'vitest';
import { isIsoDateString, parseExpenseDateToIso } from './parseExpenseDate';

describe('parseExpenseDateToIso', () => {
  it('passes through valid ISO dates', () => {
    expect(parseExpenseDateToIso('2026-07-10')).toBe('2026-07-10');
  });

  it('migrates legacy localized date strings', () => {
    const result = parseExpenseDateToIso('7/10/2026');
    expect(isIsoDateString(result)).toBe(true);
  });
});

describe('isIsoDateString', () => {
  it('rejects invalid formats', () => {
    expect(isIsoDateString('10/07/2026')).toBe(false);
    expect(isIsoDateString('2026-13-01')).toBe(false);
  });
});
