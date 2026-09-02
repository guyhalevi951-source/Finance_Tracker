import { type Expense } from '../../types/expense';

export interface ShouldScheduleOneTimeExpenseInput {
  date: string;
  hasRecurrenceRule: boolean;
}

export function shouldScheduleOneTimeExpense(
  input: ShouldScheduleOneTimeExpenseInput,
  todayIso: string,
): boolean {
  if (input.hasRecurrenceRule) return false;
  return input.date > todayIso;
}

export function isScheduledOneTimeExpense(expense: Expense): boolean {
  return expense.scheduled === true && expense.recurrenceRule === undefined;
}

export function listScheduledOneTimeExpenses(expenses: Expense[]): Expense[] {
  return expenses
    .filter(isScheduledOneTimeExpense)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function materializeDueScheduledExpenses(
  expenses: Expense[],
  todayIso: string,
): Expense[] {
  let changed = false;

  const next = expenses.map((expense) => {
    if (!isScheduledOneTimeExpense(expense)) return expense;
    if (expense.date > todayIso) return expense;

    changed = true;
    const { scheduled, ...materialized } = expense;
    return materialized;
  });

  return changed ? next : expenses;
}
