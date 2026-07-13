import { describe, it, expect } from 'vitest';
import { generateExpenseId } from './generateId';

describe('generateExpenseId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateExpenseId()).toBe('string');
    expect(generateExpenseId().length).toBeGreaterThan(0);
  });

  it('produces unique IDs on consecutive calls (no collision)', () => {
    const ids = Array.from({ length: 100 }, () => generateExpenseId());
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });

  it('returns a valid UUID v4 format', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(generateExpenseId()).toMatch(uuidRegex);
  });
});
