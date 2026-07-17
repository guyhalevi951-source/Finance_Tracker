import { describe, expect, it } from 'vitest';
import {
  computeRemainingOccurrences,
  remainingOccurrencesToRuleLimit,
  ruleLimitToRemainingSelection,
} from './occurrencesRemaining';

describe('occurrencesRemaining', () => {
  it('converts remaining to absolute rule limit', () => {
    expect(remainingOccurrencesToRuleLimit(null, 5)).toBe(null);
    expect(remainingOccurrencesToRuleLimit(3, 5)).toBe(8);
  });

  it('computes remaining from rule limit and count', () => {
    expect(computeRemainingOccurrences(null, 5)).toBe(null);
    expect(computeRemainingOccurrences(8, 5)).toBe(3);
    expect(computeRemainingOccurrences(3, 5)).toBe(0);
  });

  it('maps rule limit to remaining selection chips', () => {
    expect(
      ruleLimitToRemainingSelection({ type: 'daily', interval: 1, occurrences: null }, 3),
    ).toEqual({ occurrencesLimit: 'unlimited' });

    expect(
      ruleLimitToRemainingSelection({ type: 'daily', interval: 1, occurrences: 8 }, 5),
    ).toEqual({ occurrencesLimit: '3' });

    expect(
      ruleLimitToRemainingSelection({ type: 'daily', interval: 1, occurrences: 12 }, 5),
    ).toEqual({ occurrencesLimit: 'custom', customOccurrences: 7 });
  });
});
