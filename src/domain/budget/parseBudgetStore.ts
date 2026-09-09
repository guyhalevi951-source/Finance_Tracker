import { type BudgetStore, type MonthBudgetEntry } from '../../types/budget';
import { Result, err, ok } from '../../types/result';

export type ParseBudgetStoreError = 'CORRUPTED_STORE' | 'INVALID_ENTRY';

const MONTH_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function isValidMonthBudgetEntry(value: unknown): value is MonthBudgetEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  const amountValid =
    entry.amount === null ||
    (typeof entry.amount === 'number' && !Number.isNaN(entry.amount) && entry.amount >= 0);
  const carryValid = typeof entry.carryOverToNext === 'boolean';

  return amountValid && carryValid;
}

/** Validates an already-deserialized value as a `BudgetStore` (month key -> entry). */
export function parseBudgetStoreValue(parsed: unknown): Result<BudgetStore, ParseBudgetStoreError> {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return err('CORRUPTED_STORE');
  }

  const store: BudgetStore = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!MONTH_KEY_PATTERN.test(key) || !isValidMonthBudgetEntry(value)) {
      return err('INVALID_ENTRY');
    }
    store[key] = value;
  }

  return ok(store);
}
