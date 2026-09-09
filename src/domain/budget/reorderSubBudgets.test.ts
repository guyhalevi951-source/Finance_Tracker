import { describe, expect, it } from 'vitest';
import { type SubBudgetRecord } from '../../types/budget';
import { reorderSubBudgets } from './reorderSubBudgets';

const budgets: SubBudgetRecord[] = [
  {
    id: 'a',
    kind: 'temporary',
    name: { en: 'A', he: 'א' },
    totalAmount: 100,
    includeInMonthlyBudget: true,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    sortOrder: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'b',
    kind: 'temporary',
    name: { en: 'B', he: 'ב' },
    totalAmount: 200,
    includeInMonthlyBudget: true,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    sortOrder: 1,
    createdAt: '2026-02-01',
  },
  {
    id: 'f',
    kind: 'fixed',
    name: { en: 'F', he: 'פ' },
    totalAmount: 300,
    includeInMonthlyBudget: true,
    monthOverrides: {},
    sortOrder: 0,
    createdAt: '2026-02-01',
  },
];

describe('reorderSubBudgets', () => {
  it('recomputes sortOrder contiguously for the listed group', () => {
    const reordered = reorderSubBudgets(budgets, ['b', 'a']);
    const byId = new Map(reordered.map((b) => [b.id, b.sortOrder]));
    expect(byId.get('b')).toBe(0);
    expect(byId.get('a')).toBe(1);
  });

  it('keeps budgets outside the listed group untouched', () => {
    const reordered = reorderSubBudgets(budgets, ['b', 'a']);
    expect(reordered).toHaveLength(3);
    expect(reordered.find((b) => b.id === 'f')).toBe(budgets[2]);
  });
});
