import { describe, expect, it } from 'vitest';
import { type BudgetStore } from '../../types/budget';
import { clearMonthBudgetAmount, upsertMonthBudgetEntry } from './budgetStorePolicy';

describe('clearMonthBudgetAmount', () => {
  it('clears amount while preserving carryOverToNext', () => {
    const store: BudgetStore = {
      '2026-09': { amount: 5000, carryOverToNext: false },
    };

    const next = clearMonthBudgetAmount(store, '2026-09');

    expect(next['2026-09']).toEqual({ amount: null, carryOverToNext: false });
  });

  it('does not mutate other months', () => {
    const store: BudgetStore = {
      '2026-09': { amount: 5000, carryOverToNext: true },
      '2026-10': { amount: 4000, carryOverToNext: true },
    };

    const next = clearMonthBudgetAmount(store, '2026-10');

    expect(next['2026-09']).toEqual({ amount: 5000, carryOverToNext: true });
    expect(next['2026-10']).toEqual({ amount: null, carryOverToNext: true });
  });

  it('creates entry with default carryOverToNext when month was missing', () => {
    const next = clearMonthBudgetAmount({}, '2026-09');

    expect(next['2026-09']).toEqual({ amount: null, carryOverToNext: false });
  });
});

describe('upsertMonthBudgetEntry', () => {
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
});
