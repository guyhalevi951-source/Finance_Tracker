import { describe, it, expect, beforeEach } from 'vitest';
import { loadBudget, saveBudget } from './budgetLocalStorage';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => localStorageMock.clear());

describe('loadBudget', () => {
  it('returns NOT_FOUND when nothing stored', () => {
    const result = loadBudget();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_FOUND');
  });

  it('returns the stored budget', () => {
    saveBudget(1500);
    const result = loadBudget();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(1500);
  });

  it('returns CORRUPTED_BUDGET for non-numeric data', () => {
    localStorage.setItem('monthlyBudget', 'bad-data');
    const result = loadBudget();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CORRUPTED_BUDGET');
  });
});
