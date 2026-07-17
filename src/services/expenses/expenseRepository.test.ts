import { describe, it, expect, beforeEach } from 'vitest';
import { loadExpenses, applyExpenseBatch, migrateExpense } from './expenseRepository';
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
  description: { en: 'Test', he: 'Test' },
  amount: 10.5,
  category: 'food.groceries',
  date: '2026-07-14',
  paymentMethod: 'cash',
};

beforeEach(() => localStorageMock.clear());

describe('loadExpenses guest', () => {
  it('returns empty array when nothing stored', async () => {
    const result = await loadExpenses(null);
    expect(result).toEqual([]);
  });

  it('migrates legacy plain-string descriptions and dates', async () => {
    localStorage.setItem(
      'expenses',
      JSON.stringify([{ id: '2', description: 'סופר', amount: 50, category: 'אוכל', date: '14/7/2026' }]),
    );
    const result = await loadExpenses(null);
    expect(result[0].description).toEqual({ en: 'סופר', he: 'סופר' });
    expect(result[0].category).toBe('food.groceries');
    expect(result[0].paymentMethod).toBe('cash');
    expect(result[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('throws on corrupt JSON', async () => {
    localStorage.setItem('expenses', '{bad json');
    await expect(loadExpenses(null)).rejects.toThrow('CORRUPTED_EXPENSES');
  });
});

describe('applyExpenseBatch guest', () => {
  it('persists full expense list', async () => {
    await applyExpenseBatch(null, [sampleExpense]);
    const loaded = await loadExpenses(null);
    expect(loaded).toEqual([sampleExpense]);
  });

  it('replaces list on batch update', async () => {
    await applyExpenseBatch(null, [sampleExpense]);
    const updated = { ...sampleExpense, amount: 99 };
    await applyExpenseBatch(null, [updated]);
    const loaded = await loadExpenses(null);
    expect(loaded[0].amount).toBe(99);
  });
});

describe('migrateExpense', () => {
  it('adds default payment method when missing', () => {
    const migrated = migrateExpense({
      id: 'x',
      description: { en: 'A', he: 'A' },
      amount: 5,
      category: 'food',
      date: '2026-01-01',
    });
    expect(migrated.paymentMethod).toBe('cash');
  });

  it('preserves valid recurrenceRule and recurrenceSeriesId', () => {
    const migrated = migrateExpense({
      id: 'x',
      description: { en: 'A', he: 'A' },
      amount: 5,
      category: 'food.groceries',
      date: '2026-01-01',
      paymentMethod: 'cash',
      recurrenceRule: { type: 'weekly', interval: 1, customDays: [], occurrences: null },
      recurrenceSeriesId: 'template-1',
    });
    expect(migrated.recurrenceRule).toEqual({
      type: 'weekly',
      interval: 1,
      customDays: [],
      occurrences: null,
    });
    expect(migrated.recurrenceSeriesId).toBe('template-1');
  });

  it('strips invalid recurrenceRule', () => {
    const migrated = migrateExpense({
      id: 'x',
      description: { en: 'A', he: 'A' },
      amount: 5,
      category: 'food.groceries',
      date: '2026-01-01',
      paymentMethod: 'cash',
      recurrenceRule: { type: 'weekly', interval: 0 },
    });
    expect(migrated.recurrenceRule).toBeUndefined();
  });

  it('preserves valid recurrenceExcludedDates and filters invalid entries', () => {
    const migrated = migrateExpense({
      id: 'x',
      description: { en: 'A', he: 'A' },
      amount: 5,
      category: 'food.groceries',
      date: '2026-01-01',
      paymentMethod: 'cash',
      recurrenceRule: { type: 'daily', interval: 1, occurrences: null },
      recurrenceExcludedDates: ['2026-03-02', 'invalid', 42],
    });
    expect(migrated.recurrenceExcludedDates).toEqual(['2026-03-02']);
  });
});
