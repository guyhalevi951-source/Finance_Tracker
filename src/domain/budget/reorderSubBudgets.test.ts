import { describe, expect, it } from 'vitest';
import { type SubBudgetRecord } from '../../types/budget';
import { reorderSubBudgets } from './reorderSubBudgets';

const budgets: SubBudgetRecord[] = [
  {
    id: 'a',
    name: { en: 'A', he: 'א' },
    totalAmount: 100,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    sortOrder: 0,
    createdAt: '2026-01-01',
  },
  {
    id: 'b',
    name: { en: 'B', he: 'ב' },
    totalAmount: 200,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    sortOrder: 1,
    createdAt: '2026-02-01',
  },
];

describe('reorderSubBudgets', () => {
  it('recomputes sortOrder contiguously', () => {
    const reordered = reorderSubBudgets(budgets, ['b', 'a']);
    expect(reordered.map((b) => b.id)).toEqual(['b', 'a']);
    expect(reordered.map((b) => b.sortOrder)).toEqual([0, 1]);
  });
});
