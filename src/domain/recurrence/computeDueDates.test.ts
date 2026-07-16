import { describe, it, expect } from 'vitest';
import { computeDueDates } from './computeDueDates';
import { selectionToRule } from './presets';

describe('selectionToRule', () => {
  it('maps daily preset', () => {
    expect(selectionToRule({ preset: 'daily' })).toEqual({ type: 'daily', interval: 1 });
  });

  it('maps custom interval days', () => {
    expect(
      selectionToRule({
        preset: 'custom',
        customMode: 'intervalDays',
        customIntervalDays: 3,
      }),
    ).toEqual({ type: 'daily', interval: 3 });
  });

  it('maps custom weekdays', () => {
    expect(
      selectionToRule({
        preset: 'custom',
        customMode: 'weekdays',
        customWeekdays: [1, 4],
      }),
    ).toEqual({ type: 'weekly', interval: 1, customDays: [1, 4] });
  });
});

describe('computeDueDates', () => {
  it('returns daily occurrences after anchor through end date', () => {
    const dates = computeDueDates(
      '2026-07-01',
      { type: 'daily', interval: 1 },
      '2026-07-05',
    );
    expect(dates).toEqual(['2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05']);
  });

  it('returns every-N-days occurrences', () => {
    const dates = computeDueDates(
      '2026-07-01',
      { type: 'daily', interval: 2 },
      '2026-07-10',
    );
    expect(dates).toEqual(['2026-07-03', '2026-07-05', '2026-07-07', '2026-07-09']);
  });

  it('returns weekly occurrences on anchor weekday', () => {
    const dates = computeDueDates(
      '2026-07-01',
      { type: 'weekly', interval: 1, customDays: [] },
      '2026-07-22',
    );
    expect(dates).toEqual(['2026-07-08', '2026-07-15', '2026-07-22']);
  });

  it('returns matching custom weekday occurrences', () => {
    const dates = computeDueDates(
      '2026-07-01',
      { type: 'weekly', interval: 1, customDays: [1, 4] },
      '2026-07-10',
    );
    expect(dates).toContain('2026-07-02');
    expect(dates).toContain('2026-07-06');
    expect(dates).toContain('2026-07-09');
  });

  it('returns monthly occurrences', () => {
    const dates = computeDueDates(
      '2026-01-15',
      { type: 'monthly', interval: 1 },
      '2026-03-20',
    );
    expect(dates).toEqual(['2026-02-15', '2026-03-15']);
  });

  it('returns yearly occurrences', () => {
    const dates = computeDueDates(
      '2024-07-01',
      { type: 'yearly', interval: 1 },
      '2026-07-01',
    );
    expect(dates).toEqual(['2025-07-01', '2026-07-01']);
  });

  it('returns empty when through is before anchor', () => {
    expect(
      computeDueDates('2026-07-10', { type: 'daily', interval: 1 }, '2026-07-01'),
    ).toEqual([]);
  });
});
