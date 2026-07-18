import { describe, expect, it } from 'vitest';
import { dayAfterIso, dayBeforeIso } from './shiftIsoDate';

describe('shiftIsoDate', () => {
  it('dayAfterIso advances one calendar day', () => {
    expect(dayAfterIso('2026-07-18')).toBe('2026-07-19');
  });

  it('dayBeforeIso retreats one calendar day', () => {
    expect(dayBeforeIso('2026-07-18')).toBe('2026-07-17');
  });
});
