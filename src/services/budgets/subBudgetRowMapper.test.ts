import { describe, expect, it } from 'vitest';
import { type SubBudgetRecord } from '../../types/budget';
import { subBudgetRowToRaw, subBudgetToRow } from './subBudgetRowMapper';

describe('sub-budget row mapper', () => {
  it('maps a temporary budget and restores dates', () => {
    const budget: SubBudgetRecord = {
      id: 'tmp-1',
      name: { en: 'Trip', he: 'טיול' },
      totalAmount: 1000,
      includeInMonthlyBudget: true,
      sortOrder: 2,
      createdAt: '2026-09-01T00:00:00.000Z',
      kind: 'temporary',
      startDate: '2026-09-01',
      endDate: '2026-09-15',
    };

    const row = subBudgetToRow('user-1', budget);
    expect(row.kind).toBe('temporary');
    expect(row.start_date).toBe('2026-09-01');
    expect(row.end_date).toBe('2026-09-15');
    expect(row.month_overrides).toEqual({});

    const raw = subBudgetRowToRaw(row);
    expect(raw.startDate).toBe('2026-09-01');
    expect(raw.includeInMonthlyBudget).toBe(true);
  });

  it('maps a fixed budget with month overrides and null cap', () => {
    const budget: SubBudgetRecord = {
      id: 'fix-1',
      name: { en: 'Car', he: 'רכב' },
      totalAmount: null,
      includeInMonthlyBudget: false,
      sortOrder: 0,
      createdAt: '2026-09-01T00:00:00.000Z',
      kind: 'fixed',
      monthOverrides: { '2026-09': { amount: 200, carryOverToNext: true } },
      purgedFromHistory: true,
    };

    const row = subBudgetToRow('user-1', budget);
    expect(row.total_amount).toBeNull();
    expect(row.start_date).toBeNull();
    expect(row.month_overrides).toEqual(budget.monthOverrides);
    expect(row.purged_from_history).toBe(true);

    const raw = subBudgetRowToRaw(row);
    expect(raw.kind).toBe('fixed');
    expect(raw.monthOverrides).toEqual(budget.monthOverrides);
    expect(raw.purgedFromHistory).toBe(true);
  });
});
