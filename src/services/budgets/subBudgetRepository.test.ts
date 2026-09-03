import { describe, it, expect, beforeEach } from 'vitest';
import { type SubBudgetRecord } from '../../types/budget';
import { loadSubBudgets, saveSubBudget, saveSubBudgetsOrder } from './subBudgetRepository';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => localStorageMock.clear());

const sample: SubBudgetRecord = {
  id: 'sub1',
  name: { en: 'Vacation', he: 'חופשה' },
  totalAmount: 3000,
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
};

describe('subBudgetRepository guest', () => {
  it('round-trips a sub-budget', async () => {
    await saveSubBudget(null, sample);
    const loaded = await loadSubBudgets(null);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(sample);
  });

  it('persists reordered sortOrder', async () => {
    const second = { ...sample, id: 'sub2', sortOrder: 1 };
    await saveSubBudget(null, sample);
    await saveSubBudget(null, second);
    await saveSubBudgetsOrder(null, [
      { ...second, sortOrder: 0 },
      { ...sample, sortOrder: 1 },
    ]);
    const loaded = await loadSubBudgets(null);
    expect(loaded.map((b) => b.id)).toEqual(['sub2', 'sub1']);
  });
});
