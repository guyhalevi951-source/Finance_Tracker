import { describe, it, expect, beforeEach } from 'vitest';
import { loadBudget, loadExpenses, saveBudget, saveExpenses } from './budgetLocalStorage';
import type { Expense } from '../../types/expense';

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

const sampleExpense: Expense = {
  id: '1',
  description: 'Test',
  amount: 10.5,
  category: 'אוכל',
  date: '14/7/2026',
};

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

describe('loadExpenses', () => {
  it('returns NOT_FOUND when nothing stored', () => {
    const result = loadExpenses();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('NOT_FOUND');
  });

  it('returns saved expenses', () => {
    saveExpenses([sampleExpense]);
    const result = loadExpenses();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([sampleExpense]);
  });

  it('returns CORRUPTED_EXPENSES for invalid JSON', () => {
    localStorage.setItem('expenses', '{bad json');
    const result = loadExpenses();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('CORRUPTED_EXPENSES');
  });

  it('returns INVALID_EXPENSES when array items fail shape check', () => {
    localStorage.setItem('expenses', JSON.stringify([{ id: 1, description: 'X' }]));
    const result = loadExpenses();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_EXPENSES');
  });

  it('returns INVALID_EXPENSES when root is not an array', () => {
    localStorage.setItem('expenses', JSON.stringify({ data: [] }));
    const result = loadExpenses();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('INVALID_EXPENSES');
  });
});
