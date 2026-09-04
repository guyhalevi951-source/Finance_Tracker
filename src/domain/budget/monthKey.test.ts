import { describe, expect, it } from 'vitest';
import { nextMonthKey, previousMonthKey } from './monthKey';

describe('monthKey navigation', () => {
  it('nextMonthKey advances within the same year', () => {
    expect(nextMonthKey('2026-09')).toBe('2026-10');
  });

  it('nextMonthKey rolls over December to January', () => {
    expect(nextMonthKey('2026-12')).toBe('2027-01');
  });

  it('previousMonthKey retreats within the same year', () => {
    expect(previousMonthKey('2026-10')).toBe('2026-09');
  });
});
