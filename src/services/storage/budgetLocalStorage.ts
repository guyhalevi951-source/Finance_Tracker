import { toMonthKey } from '../../domain/budget/monthKey';
import { type BudgetStore, type MonthBudgetEntry } from '../../types/budget';
import { Result, err, ok } from '../../types/result';

const BUDGET_STORE_KEY = 'monthlyBudgetStore';
const LEGACY_BUDGET_KEY = 'monthlyBudget';

export type LoadBudgetStoreError = 'CORRUPTED_STORE' | 'INVALID_ENTRY';

function isValidEntry(value: unknown): value is MonthBudgetEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  const amountValid =
    entry.amount === null || (typeof entry.amount === 'number' && !Number.isNaN(entry.amount) && entry.amount >= 0);
  const carryValid = typeof entry.carryOverToNext === 'boolean';

  return amountValid && carryValid;
}

function parseBudgetStore(raw: string): Result<BudgetStore, LoadBudgetStoreError> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err('CORRUPTED_STORE');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return err('CORRUPTED_STORE');
  }

  const store: BudgetStore = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!/^\d{4}-\d{2}$/.test(key) || !isValidEntry(value)) {
      return err('INVALID_ENTRY');
    }
    store[key] = value;
  }

  return ok(store);
}

function migrateLegacyBudget(store: BudgetStore): BudgetStore {
  const legacyRaw = localStorage.getItem(LEGACY_BUDGET_KEY);
  if (legacyRaw === null || Object.keys(store).length > 0) {
    return store;
  }

  const parsed = parseFloat(legacyRaw);
  if (Number.isNaN(parsed) || parsed < 0) {
    localStorage.removeItem(LEGACY_BUDGET_KEY);
    return store;
  }

  const today = new Date();
  const monthKey = toMonthKey(today.getFullYear(), today.getMonth());
  const migrated: BudgetStore = {
    ...store,
    [monthKey]: { amount: parsed, carryOverToNext: true },
  };

  localStorage.removeItem(LEGACY_BUDGET_KEY);
  return migrated;
}

export function loadBudgetStore(): Result<BudgetStore, LoadBudgetStoreError> {
  const raw = localStorage.getItem(BUDGET_STORE_KEY);

  if (raw === null) {
    const migrated = migrateLegacyBudget({});
    if (Object.keys(migrated).length > 0) {
      saveBudgetStore(migrated);
    }
    return ok(migrated);
  }

  const parsed = parseBudgetStore(raw);
  if (!parsed.ok) {
    return parsed;
  }

  const migrated = migrateLegacyBudget(parsed.value);
  if (migrated !== parsed.value) {
    saveBudgetStore(migrated);
  }

  return ok(migrated);
}

export function saveBudgetStore(store: BudgetStore): void {
  localStorage.setItem(BUDGET_STORE_KEY, JSON.stringify(store));
}
