import { type Expense } from '../../types/expense';

export function earliestEndDate(existing: string | undefined, candidate: string): string {
  if (!existing) return candidate;
  return existing < candidate ? existing : candidate;
}

export function capTemplateEndDate(expense: Expense, endDate: string): Expense {
  return { ...expense, recurrenceEndDate: earliestEndDate(expense.recurrenceEndDate, endDate) };
}
