import { describe, it, expect } from 'vitest';
import { toMinorUnits, fromMinorUnits, sumAmounts, subtractAmounts } from './arithmetic';

describe('toMinorUnits', () => {
  it('converts 1.23 to 123', () => {
    expect(toMinorUnits(1.23)).toBe(123);
  });

  it('converts 0.1 without float drift', () => {
    expect(toMinorUnits(0.1)).toBe(10);
  });

  it('converts 0 to 0', () => {
    expect(toMinorUnits(0)).toBe(0);
  });
});

describe('fromMinorUnits', () => {
  it('converts 123 to 1.23', () => {
    expect(fromMinorUnits(123)).toBe(1.23);
  });
});

describe('sumAmounts', () => {
  it('correctly sums 0.1 + 0.2 to 0.3 (no float drift)', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3);
  });

  it('sums an empty array to 0', () => {
    expect(sumAmounts([])).toBe(0);
  });

  it('sums multiple amounts correctly', () => {
    expect(sumAmounts([1.1, 2.2, 3.3])).toBe(6.6);
  });

  it('handles large amounts', () => {
    expect(sumAmounts([9999.99, 0.01])).toBe(10000.0);
  });
});

describe('subtractAmounts', () => {
  it('subtracts without float drift', () => {
    expect(subtractAmounts(0.3, 0.1)).toBe(0.2);
  });

  it('returns negative when b > a', () => {
    expect(subtractAmounts(100, 150)).toBe(-50);
  });
});
