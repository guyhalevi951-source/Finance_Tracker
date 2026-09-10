import { GUEST_FINANCE_STORAGE_KEYS } from '../../config/storage/guestKeys';
import { toMonthKey } from '../../domain/budget/monthKey';
import {
  parseBudgetStoreValue,
  type ParseBudgetStoreError,
} from '../../domain/budget/parseBudgetStore';
import { type BudgetStore } from '../../types/budget';
import { Result, err, ok } from '../../types/result';

const BUDGET_STORE_KEY = GUEST_FINANCE_STORAGE_KEYS.monthlyBudgetStore;
const LEGACY_BUDGET_KEY = GUEST_FINANCE_STORAGE_KEYS.monthlyBudgetLegacy;

export type LoadBudgetStoreError = ParseBudgetStoreError;

function parseBudgetStore(raw: string): Result<BudgetStore, LoadBudgetStoreError> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err('CORRUPTED_STORE');
  }

  return parseBudgetStoreValue(parsed);
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
    [monthKey]: { amount: parsed, carryOverToNext: false },
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

export function clearGuestBudgetStore(): void {
  localStorage.removeItem(BUDGET_STORE_KEY);
  localStorage.removeItem(LEGACY_BUDGET_KEY);
}
