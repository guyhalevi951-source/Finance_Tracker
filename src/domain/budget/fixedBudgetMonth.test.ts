import { describe, expect, it } from 'vitest';
import { type FixedSubBudgetRecord } from '../../types/budget';
import { resolveFixedBudgetMonthAmount } from './fixedBudgetMonth';

const base: FixedSubBudgetRecord = {
  id: 'f1',
  kind: 'fixed',
  name: { en: 'Groceries', he: 'מכולת' },
  totalAmount: 1500,
  includeInMonthlyBudget: true,
  monthOverrides: {},
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('resolveFixedBudgetMonthAmount', () => {
  it('falls back to totalAmount when no override or carry-over applies', () => {
    const resolved = resolveFixedBudgetMonthAmount(base, '2026-09');
    expect(resolved.amount).toBe(1500);
    expect(resolved.source).toBe('default');
    expect(resolved.isExplicit).toBe(false);
  });

  it('uses an explicit month override', () => {
    const budget: FixedSubBudgetRecord = {
      ...base,
      monthOverrides: { '2026-09': { amount: 900, carryOverToNext: false } },
    };
    const resolved = resolveFixedBudgetMonthAmount(budget, '2026-09');
    expect(resolved.amount).toBe(900);
    expect(resolved.source).toBe('explicit');
  });

  it('inherits an override when the previous month carries over', () => {
    const budget: FixedSubBudgetRecord = {
      ...base,
      monthOverrides: { '2026-08': { amount: 900, carryOverToNext: true } },
    };
    expect(resolveFixedBudgetMonthAmount(budget, '2026-09')).toMatchObject({
      amount: 900,
      source: 'inherited',
    });
    expect(resolveFixedBudgetMonthAmount(budget, '2026-10').amount).toBe(1500);
  });

  it('stays source none when totalAmount is null and no override applies', () => {
    const budget: FixedSubBudgetRecord = { ...base, totalAmount: null };
    const resolved = resolveFixedBudgetMonthAmount(budget, '2026-09');
    expect(resolved.amount).toBe(0);
    expect(resolved.source).toBe('none');
  });

  it('uses an explicit month override when totalAmount is null', () => {
    const budget: FixedSubBudgetRecord = {
      ...base,
      totalAmount: null,
      monthOverrides: { '2026-09': { amount: 900, carryOverToNext: false } },
    };
    const resolved = resolveFixedBudgetMonthAmount(budget, '2026-09');
    expect(resolved.amount).toBe(900);
    expect(resolved.source).toBe('explicit');
  });
});
