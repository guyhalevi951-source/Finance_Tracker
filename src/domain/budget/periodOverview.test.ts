import { describe, it, expect } from 'vitest';
import {
  computePeriodBudget,
  computePeriodOverview,
} from './periodOverview';
import { type Expense } from '../../types/expense';

function expense(id: string, date: string, amount: number): Expense {
  return {
    id,
    description: { en: 'Test', he: 'בדיקה' },
    amount,
    category: 'food',
    date,
    paymentMethod: 'cash',
  };
}

describe('computePeriodBudget', () => {
  const julyRange = { startIso: '2026-07-01', endIso: '2026-07-31' };

  it('returns full monthly budget for a full month', () => {
    expect(computePeriodBudget(300, julyRange)).toBe(300);
  });

  it('prorates weekly budget by day count', () => {
    const weekRange = { startIso: '2026-07-01', endIso: '2026-07-07' };
    expect(computePeriodBudget(300, weekRange)).toBeCloseTo(67.74, 2);
  });

  it('prorates single-day budget', () => {
    const dayRange = { startIso: '2026-07-17', endIso: '2026-07-17' };
    expect(computePeriodBudget(300, dayRange)).toBeCloseTo(9.68, 2);
  });
});

describe('computePeriodOverview', () => {
  const julyRange = { startIso: '2026-07-01', endIso: '2026-07-31' };

  it('matches reference metrics for budget 300, spent 143, 30-day month', () => {
    const juneRange = { startIso: '2026-06-01', endIso: '2026-06-30' };
    const expenses = [expense('a', '2026-06-10', 100), expense('b', '2026-06-20', 43)];
    const overview = computePeriodOverview({
      monthlyBudget: 300,
      expenses,
      range: juneRange,
      todayIso: '2026-06-01',
    });

    expect(overview.periodBudget).toBe(300);
    expect(overview.spent).toBe(143);
    expect(overview.leftToSpend).toBe(157);
    expect(overview.isOverspent).toBe(false);
    expect(overview.daysInPeriod).toBe(30);
    expect(overview.remainingDays).toBe(30);
    expect(overview.averagePerDay).toBeCloseTo(4.77, 2);
    expect(overview.leftPerDay).toBeCloseTo(5.23, 2);
    expect(overview.dailyTotals).toHaveLength(30);
  });

  it('flags overspent when spent exceeds period budget', () => {
    const overview = computePeriodOverview({
      monthlyBudget: 100,
      expenses: [expense('a', '2026-07-05', 150)],
      range: julyRange,
      todayIso: '2026-07-10',
    });

    expect(overview.isOverspent).toBe(true);
    expect(overview.leftToSpend).toBe(-50);
  });

  it('has zero remaining days when today is after the period', () => {
    const overview = computePeriodOverview({
      monthlyBudget: 300,
      expenses: [],
      range: julyRange,
      todayIso: '2026-08-01',
    });

    expect(overview.remainingDays).toBe(0);
    expect(overview.leftPerDay).toBe(0);
  });

  it('counts remaining days from period start when today is before the range', () => {
    const overview = computePeriodOverview({
      monthlyBudget: 300,
      expenses: [],
      range: julyRange,
      todayIso: '2026-06-15',
    });

    expect(overview.remainingDays).toBe(31);
  });

  it('prorates budget for a weekly range', () => {
    const weekRange = { startIso: '2026-07-01', endIso: '2026-07-07' };
    const overview = computePeriodOverview({
      monthlyBudget: 300,
      expenses: [expense('a', '2026-07-03', 50)],
      range: weekRange,
      todayIso: '2026-07-05',
    });

    expect(overview.periodBudget).toBeCloseTo(67.74, 2);
    expect(overview.daysInPeriod).toBe(7);
    expect(overview.dailyTotals).toHaveLength(7);
  });
});
