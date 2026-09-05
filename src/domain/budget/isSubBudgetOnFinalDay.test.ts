import { describe, expect, it } from 'vitest';
import { isSubBudgetOnFinalDay } from './isSubBudgetOnFinalDay';

describe('isSubBudgetOnFinalDay', () => {
  it('returns false for master even when today matches a supplied end date', () => {
    expect(isSubBudgetOnFinalDay(true, '2026-09-06', '2026-09-06')).toBe(false);
  });

  it('returns false when the sub-budget has no end date', () => {
    expect(isSubBudgetOnFinalDay(false, null, '2026-09-06')).toBe(false);
  });

  it('returns true when today is the sub-budget end date', () => {
    expect(isSubBudgetOnFinalDay(false, '2026-09-06', '2026-09-06')).toBe(true);
  });

  it('returns false the day before the sub-budget ends', () => {
    expect(isSubBudgetOnFinalDay(false, '2026-09-06', '2026-09-05')).toBe(false);
  });

  it('returns false the day after the sub-budget ends', () => {
    expect(isSubBudgetOnFinalDay(false, '2026-09-06', '2026-09-07')).toBe(false);
  });
});
