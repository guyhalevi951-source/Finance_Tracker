import { describe, expect, it } from 'vitest';
import { type BudgetStore } from '../../types/budget';
import { upsertMonthBudgetEntry } from './budgetStorePolicy';
import { resolveMonthBudget } from './resolveMonthBudget';

describe('resolveMonthBudget', () => {
  it('returns explicit amount when month has a user-defined budget', () => {
    const store: BudgetStore = {
      '2026-07': { amount: 5000, carryOverToNext: true },
    };

    expect(resolveMonthBudget(store, '2026-07')).toEqual({
      amount: 5000,
      source: 'explicit',
      carryOverToNext: true,
      isExplicit: true,
    });
  });

  it('inherits from previous month when carryOverToNext is true', () => {
    const store: BudgetStore = {
      '2026-07': { amount: 4000, carryOverToNext: true },
    };

    expect(resolveMonthBudget(store, '2026-08')).toEqual({
      amount: 4000,
      source: 'inherited',
      carryOverToNext: false,
      isExplicit: false,
    });
  });

  it('does not chain inheritance through months without carryOver opt-in', () => {
    const store: BudgetStore = {
      '2026-01': { amount: 3000, carryOverToNext: true },
    };

    expect(resolveMonthBudget(store, '2026-02').amount).toBe(3000);
    expect(resolveMonthBudget(store, '2026-02').source).toBe('inherited');
    expect(resolveMonthBudget(store, '2026-03').amount).toBe(0);
    expect(resolveMonthBudget(store, '2026-03').source).toBe('none');
  });

  it('chains inheritance when intermediate month opts in to carryover', () => {
    const store: BudgetStore = {
      '2026-01': { amount: 3000, carryOverToNext: true },
      '2026-02': { amount: null, carryOverToNext: true },
    };

    expect(resolveMonthBudget(store, '2026-03').amount).toBe(3000);
    expect(resolveMonthBudget(store, '2026-03').source).toBe('inherited');
  });

  it('does not inherit when previous month has carryOverToNext false', () => {
    const store: BudgetStore = {
      '2026-07': { amount: 4000, carryOverToNext: false },
    };

    expect(resolveMonthBudget(store, '2026-08')).toEqual({
      amount: 0,
      source: 'none',
      carryOverToNext: false,
      isExplicit: false,
    });
  });

  it('defaults carryOverToNext to false when entry is missing', () => {
    const store: BudgetStore = {
      '2026-06': { amount: 2000, carryOverToNext: true },
    };

    expect(resolveMonthBudget(store, '2026-07').carryOverToNext).toBe(false);
    expect(resolveMonthBudget(store, '2026-07').amount).toBe(2000);
  });

  it('explicit override beats inheritance', () => {
    const store: BudgetStore = {
      '2026-07': { amount: 4000, carryOverToNext: true },
      '2026-08': { amount: 6000, carryOverToNext: true },
    };

    expect(resolveMonthBudget(store, '2026-08').amount).toBe(6000);
    expect(resolveMonthBudget(store, '2026-08').source).toBe('explicit');
  });

  it('returns zero for empty store without stack overflow', () => {
    expect(resolveMonthBudget({}, '2026-09')).toEqual({
      amount: 0,
      source: 'none',
      carryOverToNext: false,
      isExplicit: false,
    });
  });

  it('upserting one month does not mutate other months', () => {
    const store: BudgetStore = {
      '2026-07': { amount: 4000, carryOverToNext: true },
      '2026-08': { amount: 5000, carryOverToNext: true },
    };

    const next = upsertMonthBudgetEntry(store, '2026-09', { carryOverToNext: false });

    expect(next['2026-07']).toEqual({ amount: 4000, carryOverToNext: true });
    expect(next['2026-08']).toEqual({ amount: 5000, carryOverToNext: true });
    expect(next['2026-09']).toEqual({ amount: null, carryOverToNext: false });
  });

  it('manual amount on N+1 beats inheritance from N', () => {
    const store: BudgetStore = {
      '2026-09': { amount: 4000, carryOverToNext: true },
      '2026-10': { amount: 6000, carryOverToNext: true },
    };

    expect(resolveMonthBudget(store, '2026-10')).toEqual({
      amount: 6000,
      source: 'explicit',
      carryOverToNext: true,
      isExplicit: true,
    });
  });
});
