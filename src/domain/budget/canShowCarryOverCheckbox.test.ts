import { describe, expect, it } from 'vitest';
import { type BudgetStore } from '../../types/budget';
import { clearMonthBudgetAmount } from './budgetStorePolicy';
import { canShowCarryOverCheckbox } from './canShowCarryOverCheckbox';

describe('canShowCarryOverCheckbox', () => {
  it('hides when the next month has a manually saved budget', () => {
    const store: BudgetStore = {
      '2026-09': { amount: 5000, carryOverToNext: true },
      '2026-10': { amount: 4000, carryOverToNext: true },
    };

    expect(canShowCarryOverCheckbox(store, '2026-09')).toBe(false);
  });

  it('shows when the next month has no explicit budget entry', () => {
    const store: BudgetStore = {
      '2026-09': { amount: 5000, carryOverToNext: true },
    };

    expect(canShowCarryOverCheckbox(store, '2026-09')).toBe(true);
  });

  it('shows when the next month entry exists but amount is null', () => {
    const store: BudgetStore = {
      '2026-09': { amount: 5000, carryOverToNext: true },
      '2026-10': { amount: null, carryOverToNext: true },
    };

    expect(canShowCarryOverCheckbox(store, '2026-09')).toBe(true);
  });

  it('shows again after the next month manual amount is cleared', () => {
    const store: BudgetStore = {
      '2026-09': { amount: 5000, carryOverToNext: true },
      '2026-10': { amount: 4000, carryOverToNext: true },
    };

    expect(canShowCarryOverCheckbox(store, '2026-09')).toBe(false);

    const cleared = clearMonthBudgetAmount(store, '2026-10');

    expect(canShowCarryOverCheckbox(cleared, '2026-09')).toBe(true);
  });
});
