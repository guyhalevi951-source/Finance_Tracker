import { describe, expect, it } from 'vitest';
import {
  computeMaxOccurrencesInSubBudgetWindow,
  evaluateSubBudgetOccurrenceCap,
  exceedsSubBudgetOccurrenceCap,
} from './subBudgetRecurrenceOccurrenceCap';

describe('subBudgetRecurrenceOccurrenceCap', () => {
  it('counts daily occurrences that fit before sub-budget end', () => {
    const max = computeMaxOccurrencesInSubBudgetWindow(
      '2026-09-01',
      { preset: 'daily', occurrencesLimit: '5' },
      '2026-09-03',
    );
    expect(max).toBe(3);
  });

  it('flags requested count above max as exceeding cap', () => {
    expect(
      exceedsSubBudgetOccurrenceCap(
        '2026-09-01',
        { preset: 'daily', occurrencesLimit: '5' },
        '2026-09-03',
      ),
    ).toBe(true);

    expect(
      exceedsSubBudgetOccurrenceCap(
        '2026-09-01',
        { preset: 'daily', occurrencesLimit: '3' },
        '2026-09-03',
      ),
    ).toBe(false);
  });

  it('treats unlimited as exceeding a bounded sub-budget window', () => {
    expect(
      exceedsSubBudgetOccurrenceCap(
        '2026-09-01',
        { preset: 'daily', occurrencesLimit: 'unlimited' },
        '2026-09-03',
      ),
    ).toBe(true);
  });

  it('returns zero max when start date is after budget end', () => {
    const evaluation = evaluateSubBudgetOccurrenceCap(
      '2026-09-10',
      { preset: 'daily', occurrencesLimit: '2' },
      '2026-09-03',
    );
    expect(evaluation.maxAllowed).toBe(0);
    expect(evaluation.exceedsCap).toBe(true);
  });
});
