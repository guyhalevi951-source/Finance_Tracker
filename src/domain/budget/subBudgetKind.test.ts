import { describe, expect, it } from 'vitest';
import { type SubBudgetRecord } from '../../types/budget';
import {
  isFixedSubBudget,
  isTemporarySubBudget,
  listBudgetsForSwitcher,
  partitionSubBudgetsByKind,
} from './subBudgetKind';

function temporary(id: string, sortOrder: number): SubBudgetRecord {
  return {
    id,
    kind: 'temporary',
    name: { en: id, he: id },
    totalAmount: 100,
    includeInMonthlyBudget: true,
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    sortOrder,
    createdAt: '2026-07-01T00:00:00.000Z',
  };
}

function fixed(id: string, sortOrder: number): SubBudgetRecord {
  return {
    id,
    kind: 'fixed',
    name: { en: id, he: id },
    totalAmount: 100,
    includeInMonthlyBudget: true,
    monthOverrides: {},
    sortOrder,
    createdAt: '2026-07-01T00:00:00.000Z',
  };
}

describe('subBudgetKind', () => {
  const budgets = [temporary('t2', 1), fixed('f2', 5), temporary('t1', 0), fixed('f1', 3)];

  it('narrows by kind', () => {
    expect(isFixedSubBudget(budgets[1])).toBe(true);
    expect(isTemporarySubBudget(budgets[1])).toBe(false);
    expect(isTemporarySubBudget(budgets[0])).toBe(true);
  });

  it('partitions into kind groups sorted by sortOrder', () => {
    const groups = partitionSubBudgetsByKind(budgets);
    expect(groups.fixed.map((b) => b.id)).toEqual(['f1', 'f2']);
    expect(groups.temporary.map((b) => b.id)).toEqual(['t1', 't2']);
  });

  it('lists fixed budgets first then temporary, each in accordion order', () => {
    expect(listBudgetsForSwitcher(budgets).map((b) => b.id)).toEqual(['f1', 'f2', 't1', 't2']);
  });
});
