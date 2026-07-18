import { describe, expect, it } from 'vitest';
import { buildCalendarGrid } from './buildCalendarGrid';

describe('buildCalendarGrid', () => {
  it('returns Sun-starting weeks with leading and trailing adjacent-month days', () => {
    const weeks = buildCalendarGrid(2026, 6);

    expect(weeks[0][0]).toEqual({ iso: '2026-06-28', inCurrentMonth: false });
    expect(weeks[0][3]).toEqual({ iso: '2026-07-01', inCurrentMonth: true });
    expect(weeks.flat().some((cell) => cell.iso === '2026-07-31' && cell.inCurrentMonth)).toBe(true);
    expect(weeks.flat().some((cell) => cell.iso === '2026-08-01' && !cell.inCurrentMonth)).toBe(
      true,
    );
  });

  it('uses six rows when the month spans six weeks', () => {
    expect(buildCalendarGrid(2026, 6)).toHaveLength(6);
  });

  it('uses five rows for a compact month layout', () => {
    expect(buildCalendarGrid(2026, 1)).toHaveLength(5);
  });
});
