import { describe, expect, it } from 'vitest';
import {
  resolveOccurrencesLimitChipLabelDescriptor,
  resolveOccurrencesLimitLabelDescriptor,
} from './resolveOccurrencesLimitLabelKey';

describe('resolveOccurrencesLimitLabelDescriptor', () => {
  it('returns null when recurrence is never', () => {
    expect(resolveOccurrencesLimitLabelDescriptor({ preset: 'never' })).toBeNull();
  });

  it('returns unlimited i18n key', () => {
    expect(
      resolveOccurrencesLimitLabelDescriptor({ preset: 'daily', occurrencesLimit: 'unlimited' }),
    ).toEqual({ key: 'addExpense.recurrence.occurrencesUnlimited' });
  });

  it('returns literal digit for preset limits', () => {
    expect(
      resolveOccurrencesLimitLabelDescriptor({ preset: 'weekly', occurrencesLimit: '3' }),
    ).toEqual({ literal: '3' });
  });

  it('returns literal custom count, not custom label key', () => {
    expect(
      resolveOccurrencesLimitLabelDescriptor({
        preset: 'monthly',
        occurrencesLimit: 'custom',
        customOccurrences: 7,
      }),
    ).toEqual({ literal: '7' });
  });
});

describe('resolveOccurrencesLimitChipLabelDescriptor', () => {
  it('returns i18n keys for unlimited and custom chips', () => {
    expect(resolveOccurrencesLimitChipLabelDescriptor('unlimited')).toEqual({
      key: 'addExpense.recurrence.occurrencesUnlimited',
    });
    expect(resolveOccurrencesLimitChipLabelDescriptor('custom')).toEqual({
      key: 'addExpense.recurrence.occurrencesCustom',
    });
  });

  it('returns literal digit for numeric presets', () => {
    expect(resolveOccurrencesLimitChipLabelDescriptor('5')).toEqual({ literal: '5' });
  });
});
