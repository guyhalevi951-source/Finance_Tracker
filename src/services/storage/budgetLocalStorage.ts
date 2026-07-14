import { Result, ok, err } from '../../types/result';
import { type Expense } from '../../types/expense';
import { wrapLegacyText } from '../../domain/i18n/buildBilingualText';
import { migrateCategoryId } from '../../domain/categories/constants';

const BUDGET_KEY = 'monthlyBudget';
const EXPENSES_KEY = 'expenses';

export type LoadBudgetError = 'NOT_FOUND' | 'CORRUPTED_BUDGET' | 'INVALID_BUDGET';
export type LoadExpensesError = 'NOT_FOUND' | 'CORRUPTED_EXPENSES' | 'INVALID_EXPENSES';

function isValidRawExpense(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.category === 'string' &&
    typeof obj.date === 'string' &&
    (typeof obj.description === 'string' ||
      (typeof obj.description === 'object' &&
        obj.description !== null &&
        typeof (obj.description as Record<string, unknown>).en === 'string' &&
        typeof (obj.description as Record<string, unknown>).he === 'string'))
  );
}

/**
 * Migrates a raw expense from localStorage into the current Expense shape.
 * Handles legacy plain-string descriptions and legacy Hebrew category names.
 */
function migrateExpense(raw: Record<string, unknown>): Expense {
  const description =
    typeof raw.description === 'string'
      ? wrapLegacyText(raw.description)
      : (raw.description as Expense['description']);

  return {
    id: raw.id as string,
    description,
    amount: raw.amount as number,
    category: migrateCategoryId(raw.category as string),
    date: raw.date as string,
  };
}

export function loadBudget(): Result<number, LoadBudgetError> {
  const raw = localStorage.getItem(BUDGET_KEY);
  if (raw === null) return err('NOT_FOUND');

  const parsed = parseFloat(raw);
  if (isNaN(parsed)) return err('CORRUPTED_BUDGET');
  if (parsed < 0) return err('INVALID_BUDGET');

  return ok(parsed);
}

export function loadExpenses(): Result<Expense[], LoadExpensesError> {
  const raw = localStorage.getItem(EXPENSES_KEY);
  if (raw === null) return err('NOT_FOUND');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err('CORRUPTED_EXPENSES');
  }

  if (!Array.isArray(parsed)) return err('INVALID_EXPENSES');
  if (!parsed.every(isValidRawExpense)) return err('INVALID_EXPENSES');

  return ok(parsed.map(migrateExpense));
}

export function saveBudget(amount: number): void {
  localStorage.setItem(BUDGET_KEY, amount.toString());
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}
