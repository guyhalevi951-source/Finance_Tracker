import { describe, expect, it } from 'vitest';
import { parseSubBudgetInput } from './validateSubBudget';

describe('parseSubBudgetInput', () => {
  it('accepts valid input', () => {
    const result = parseSubBudgetInput(
      {
        name: 'Vacation',
        totalAmount: '5000',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      },
      '2026-07-01',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalAmount).toBe(5000);
    }
  });

  it('rejects end before start', () => {
    const result = parseSubBudgetInput(
      {
        name: 'Vacation',
        totalAmount: '5000',
        startDate: '2026-08-31',
        endDate: '2026-08-01',
      },
      '2026-07-01',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('END_BEFORE_START');
  });

  it('rejects empty name', () => {
    const result = parseSubBudgetInput(
      {
        name: '  ',
        totalAmount: '100',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      },
      '2026-07-01',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NAME_REQUIRED');
  });

  it('allows end date on today', () => {
    const result = parseSubBudgetInput(
      {
        name: 'Vacation',
        totalAmount: '5000',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
      },
      '2026-09-03',
    );
    expect(result.ok).toBe(true);
  });

  it('rejects end date in the past', () => {
    const result = parseSubBudgetInput(
      {
        name: 'Vacation',
        totalAmount: '5000',
        startDate: '2026-08-01',
        endDate: '2026-09-02',
      },
      '2026-09-03',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('END_IN_PAST');
  });
});
