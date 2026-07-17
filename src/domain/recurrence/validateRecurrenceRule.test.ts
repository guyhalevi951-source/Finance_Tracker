import { describe, it, expect } from 'vitest';
import {
  validateRecurrenceRule,
  validateRecurrenceSelection,
} from './validateRecurrenceRule';

describe('validateRecurrenceRule occurrences', () => {
  it('accepts null occurrences as unlimited', () => {
    expect(
      validateRecurrenceRule({ type: 'daily', interval: 1, occurrences: null }),
    ).toBeNull();
  });

  it('rejects occurrences below 2', () => {
    expect(
      validateRecurrenceRule({ type: 'daily', interval: 1, occurrences: 1 }),
    ).toBe('RECURRENCE_OCCURRENCES_INVALID');
  });
});

describe('validateRecurrenceSelection occurrences', () => {
  it('rejects custom occurrences below 2', () => {
    expect(
      validateRecurrenceSelection({
        preset: 'daily',
        occurrencesLimit: 'custom',
        customOccurrences: 1,
      }),
    ).toBe('RECURRENCE_OCCURRENCES_INVALID');
  });

  it('accepts valid custom occurrences', () => {
    expect(
      validateRecurrenceSelection({
        preset: 'daily',
        occurrencesLimit: 'custom',
        customOccurrences: 12,
      }),
    ).toBeNull();
  });
});
