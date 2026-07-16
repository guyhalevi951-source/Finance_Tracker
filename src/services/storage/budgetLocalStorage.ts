import { Result, ok, err } from '../../types/result';

const BUDGET_KEY = 'monthlyBudget';

export type LoadBudgetError = 'NOT_FOUND' | 'CORRUPTED_BUDGET' | 'INVALID_BUDGET';

export function loadBudget(): Result<number, LoadBudgetError> {
  const raw = localStorage.getItem(BUDGET_KEY);
  if (raw === null) return err('NOT_FOUND');

  const parsed = parseFloat(raw);
  if (isNaN(parsed)) return err('CORRUPTED_BUDGET');
  if (parsed < 0) return err('INVALID_BUDGET');

  return ok(parsed);
}

export function saveBudget(amount: number): void {
  localStorage.setItem(BUDGET_KEY, amount.toString());
}
