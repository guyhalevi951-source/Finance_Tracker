import { describe, it, expect, beforeEach } from 'vitest';
import { loadBudgetStore, saveBudgetStore } from './budgetLocalStorage';

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

describe('loadBudgetStore', () => {
  it('returns an empty store when nothing stored', () => {
    const result = loadBudgetStore();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({});
  });

  it('round-trips a valid store', () => {
    const store = {
      '2026-07': { amount: 1500, carryOverToNext: true },
      '2026-08': { amount: null, carryOverToNext: false },
    };
    saveBudgetStore(store);

    const result = loadBudgetStore();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(store);
  });

  it('returns CORRUPTED_STORE for invalid JSON', () => {
    localStorage.setItem('monthlyBudgetStore', 'not-json');
    const result = loadBudgetStore();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CORRUPTED_STORE');
  });

  it('returns INVALID_ENTRY for malformed month entries', () => {
    localStorage.setItem('monthlyBudgetStore', JSON.stringify({ '2026-07': { amount: 'bad' } }));
    const result = loadBudgetStore();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_ENTRY');
  });

  it('migrates legacy monthlyBudget scalar into current month', () => {
    localStorage.setItem('monthlyBudget', '2500');

    const result = loadBudgetStore();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    expect(result.value[monthKey]).toEqual({ amount: 2500, carryOverToNext: false });
    expect(localStorage.getItem('monthlyBudget')).toBeNull();
  });

  it('does not migrate legacy budget when store already has entries', () => {
    saveBudgetStore({ '2026-01': { amount: 1000, carryOverToNext: true } });
    localStorage.setItem('monthlyBudget', '2500');

    const result = loadBudgetStore();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value['2026-01']).toEqual({ amount: 1000, carryOverToNext: true });
      expect(Object.keys(result.value)).toHaveLength(1);
    }
  });
});
