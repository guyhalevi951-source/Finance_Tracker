import { describe, expect, it } from 'vitest';
import { settingsRecurrenceEffectiveFromIso } from './settingsRecurrenceEffectiveFrom';

describe('settingsRecurrenceEffectiveFromIso', () => {
  it('returns tomorrow so settings edits exclude today (instance_date > today)', () => {
    expect(settingsRecurrenceEffectiveFromIso('2026-07-18')).toBe('2026-07-19');
  });
});
