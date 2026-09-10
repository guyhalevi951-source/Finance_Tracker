import { describe, expect, it } from 'vitest';
import { hasBudgetLimit } from './hasBudgetLimit';

describe('hasBudgetLimit', () => {
  it('is true for a positive cap', () => {
    expect(hasBudgetLimit(100)).toBe(true);
  });

  it('is false for null, undefined, and zero', () => {
    expect(hasBudgetLimit(null)).toBe(false);
    expect(hasBudgetLimit(undefined)).toBe(false);
    expect(hasBudgetLimit(0)).toBe(false);
  });

  it('is false for a negative amount', () => {
    expect(hasBudgetLimit(-1)).toBe(false);
  });
});
