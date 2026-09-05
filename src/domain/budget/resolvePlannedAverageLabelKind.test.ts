import { describe, expect, it } from 'vitest';
import { resolvePlannedAverageLabelKind } from './resolvePlannedAverageLabelKind';

describe('resolvePlannedAverageLabelKind', () => {
  it('returns monthly for master regardless of range length', () => {
    expect(
      resolvePlannedAverageLabelKind(true, {
        startIso: '2026-07-01',
        endIso: '2026-07-07',
      }),
    ).toBe('monthly');
  });

  it('returns monthly for a sub-budget that is exactly one calendar month', () => {
    expect(
      resolvePlannedAverageLabelKind(false, {
        startIso: '2026-07-01',
        endIso: '2026-07-31',
      }),
    ).toBe('monthly');
  });

  it('returns inclusive for a sub-budget shorter than a month', () => {
    expect(
      resolvePlannedAverageLabelKind(false, {
        startIso: '2026-09-01',
        endIso: '2026-09-04',
      }),
    ).toBe('inclusive');
  });

  it('returns inclusive when a sub-budget does not cover the full relevant month', () => {
    expect(
      resolvePlannedAverageLabelKind(false, {
        startIso: '2026-07-15',
        endIso: '2026-08-15',
      }),
    ).toBe('inclusive');
  });
});
