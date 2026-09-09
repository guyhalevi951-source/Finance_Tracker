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
  kind: 'temporary',
  name: { en: 'Vacation', he: 'חופשה' },
  totalAmount: 3000,
  includeInMonthlyBudget: true,
  startDate: '2026-08-01',
  endDate: '2026-08-31',
  sortOrder: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
};

const fixedSample: SubBudgetRecord = {
  id: 'fixed1',
  kind: 'fixed',
  name: { en: 'Groceries', he: 'מכולת' },
  totalAmount: 1500,
  includeInMonthlyBudget: false,
  monthOverrides: { '2026-09': { amount: 1200, carryOverToNext: true } },
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

  it('round-trips a fixed, isolated budget with month overrides', async () => {
    await saveSubBudget(null, fixedSample);
    const loaded = await loadSubBudgets(null);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(fixedSample);
  });

  it('defaults legacy records to temporary and linked', async () => {
    const legacy = {
      id: 'legacy',
      name: { en: 'Old', he: 'ישן' },
      totalAmount: 100,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      sortOrder: 0,
      createdAt: '2026-07-01T00:00:00.000Z',
    };
    localStorageMock.setItem('subBudgets', JSON.stringify([legacy]));
    const loaded = await loadSubBudgets(null);
    expect(loaded[0]).toEqual({ ...legacy, kind: 'temporary', includeInMonthlyBudget: true });
  });

  it('drops fixed records with corrupted month overrides', async () => {
    const corrupted = { ...fixedSample, monthOverrides: { 'not-a-month': { amount: 1 } } };
    localStorageMock.setItem('subBudgets', JSON.stringify([corrupted]));
    expect(await loadSubBudgets(null)).toHaveLength(0);
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
