import { describe, it, expect } from 'vitest';
import {
  filterExpensesByPeriod,
  getDefaultDayIso,
  getDefaultWeekIndex,
  getMonthBounds,
  getMonthDayIsos,
  getMonthWeekRanges,
  isDateInRange,
  resolveExpenseTimeRange,
} from './periods';
import { toIsoDate } from './parseExpenseDate';
import { type Expense } from '../../types/expense';

function expense(id: string, date: string): Expense {
  return {
    id,
    description: { en: 'Test', he: 'בדיקה' },
    amount: 10,
    category: 'food',
    date,
    paymentMethod: 'cash',
  };
}

describe('getMonthBounds', () => {
  it('covers full months of varying lengths', () => {
    expect(getMonthBounds(2026, 1)).toEqual({ startIso: '2026-02-01', endIso: '2026-02-28' });
    expect(getMonthBounds(2024, 1)).toEqual({ startIso: '2024-02-01', endIso: '2024-02-29' });
    expect(getMonthBounds(2026, 6)).toEqual({ startIso: '2026-07-01', endIso: '2026-07-31' });
  });
});

describe('getMonthWeekRanges', () => {
  it('chunks July into strict 7-day blocks from the 1st', () => {
    const weeks = getMonthWeekRanges(2026, 6);
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual({ startIso: '2026-07-01', endIso: '2026-07-07', index: 0 });
    expect(weeks[1]).toEqual({ startIso: '2026-07-08', endIso: '2026-07-14', index: 1 });
    expect(weeks[2]).toEqual({ startIso: '2026-07-15', endIso: '2026-07-21', index: 2 });
    expect(weeks[3]).toEqual({ startIso: '2026-07-22', endIso: '2026-07-28', index: 3 });
    expect(weeks[4]).toEqual({ startIso: '2026-07-29', endIso: '2026-07-31', index: 4 });
  });

  it('returns exactly 4 weeks for a 28-day February', () => {
    const weeks = getMonthWeekRanges(2026, 1);
    expect(weeks).toHaveLength(4);
    expect(weeks.at(-1)).toEqual({ startIso: '2026-02-22', endIso: '2026-02-28', index: 3 });
  });

  it('includes a single-day 5th week for leap-year February', () => {
    const weeks = getMonthWeekRanges(2024, 1);
    expect(weeks).toHaveLength(5);
    expect(weeks.at(-1)).toEqual({ startIso: '2024-02-29', endIso: '2024-02-29', index: 4 });
  });

  it('has no gaps or overlaps within the month', () => {
    const weeks = getMonthWeekRanges(2026, 6);
    const monthDays = getMonthDayIsos(2026, 6);
    const covered = new Set<string>();

    for (const week of weeks) {
      const start = new Date(`${week.startIso}T00:00:00`);
      const end = new Date(`${week.endIso}T00:00:00`);
      for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
        covered.add(toIsoDate(d));
      }
    }

    for (const day of monthDays) {
      expect(covered.has(day), `missing ${day}`).toBe(true);
    }
  });
});

describe('getMonthDayIsos', () => {
  it('returns every day in the month', () => {
    expect(getMonthDayIsos(2026, 1)).toHaveLength(28);
    expect(getMonthDayIsos(2026, 6)[0]).toBe('2026-07-01');
    expect(getMonthDayIsos(2026, 6).at(-1)).toBe('2026-07-31');
  });
});

describe('filterExpensesByPeriod', () => {
  it('filters inclusively on ISO date boundaries', () => {
    const expenses = [
      expense('a', '2026-07-01'),
      expense('b', '2026-07-15'),
      expense('c', '2026-07-31'),
      expense('d', '2026-08-01'),
    ];
    const range = { startIso: '2026-07-01', endIso: '2026-07-31' };
    expect(filterExpensesByPeriod(expenses, range).map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(isDateInRange('2026-07-01', range)).toBe(true);
    expect(isDateInRange('2026-07-31', range)).toBe(true);
    expect(isDateInRange('2026-06-30', range)).toBe(false);
  });
});

describe('resolveExpenseTimeRange', () => {
  it('returns full month for monthly granularity', () => {
    const range = resolveExpenseTimeRange(
      { year: 2026, month: 6, granularity: 'monthly', selectedWeekIndex: null, selectedDayIso: null },
    );
    expect(range).toEqual({ startIso: '2026-07-01', endIso: '2026-07-31' });
  });

  it('returns selected week range for weekly granularity', () => {
    const weeks = getMonthWeekRanges(2026, 6);
    const range = resolveExpenseTimeRange(
      {
        year: 2026,
        month: 6,
        granularity: 'weekly',
        selectedWeekIndex: 1,
        selectedDayIso: null,
      },
    );
    expect(range).toEqual({ startIso: weeks[1].startIso, endIso: weeks[1].endIso });
  });

  it('returns single day for daily granularity', () => {
    const range = resolveExpenseTimeRange(
      {
        year: 2026,
        month: 6,
        granularity: 'daily',
        selectedWeekIndex: null,
        selectedDayIso: '2026-07-17',
      },
    );
    expect(range).toEqual({ startIso: '2026-07-17', endIso: '2026-07-17' });
  });
});

describe('default sub-selections', () => {
  const ref = new Date('2026-07-17T12:00:00');

  it('defaults week index to week containing today in current month', () => {
    expect(getDefaultWeekIndex(2026, 6, ref)).toBe(2);
    expect(getDefaultWeekIndex(2026, 5, ref)).toBe(0);
  });

  it('defaults day to today in current month or first day otherwise', () => {
    expect(getDefaultDayIso(2026, 6, ref)).toBe('2026-07-17');
    expect(getDefaultDayIso(2026, 5, ref)).toBe('2026-06-01');
  });
});
