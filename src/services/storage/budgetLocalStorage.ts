import { Result, ok, err } from '../../types/result';
import { Expense } from '../../types/expense';

const BUDGET_KEY = 'monthlyBudget';
const EXPENSES_KEY = 'expenses';

export type LoadBudgetError = 'NOT_FOUND' | 'CORRUPTED_BUDGET' | 'INVALID_BUDGET';
export type LoadExpensesError = 'NOT_FOUND' | 'CORRUPTED_EXPENSES' | 'INVALID_EXPENSES';

function isValidExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.category === 'string' &&
    typeof obj.date === 'string'
  );
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
  if (!parsed.every(isValidExpense)) return err('INVALID_EXPENSES');

  return ok(parsed);
}

export function saveBudget(amount: number): void {
  localStorage.setItem(BUDGET_KEY, amount.toString());
}

export function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}
