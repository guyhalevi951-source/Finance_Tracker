import { describe, it, expect } from 'vitest';
import { canGenerateOccurrence } from './canGenerateOccurrence';

describe('canGenerateOccurrence', () => {
  it('allows generation when limit is unlimited', () => {
    expect(canGenerateOccurrence(null, 5, 0)).toBe(true);
  });

  it('allows generation while below limit', () => {
    expect(canGenerateOccurrence(3, 1, 1)).toBe(true);
  });

  it('blocks generation when limit is reached', () => {
    expect(canGenerateOccurrence(3, 2, 1)).toBe(false);
  });

  it('blocks generation when current count already equals limit', () => {
    expect(canGenerateOccurrence(3, 3, 0)).toBe(false);
  });
});
