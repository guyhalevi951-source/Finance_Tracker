import { type Expense } from '../../types/expense';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';

function dayBefore(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() - 1);
  return toIsoDate(date);
}

function earliestEndDate(existing: string | undefined, candidate: string): string {
  if (!existing) return candidate;
  return existing < candidate ? existing : candidate;
}

export function terminateRecurrenceSeries(
  expenses: Expense[],
  template: Expense,
  fromDateIso: string,
): Expense[] {
  const endDate = dayBefore(fromDateIso);

  return expenses.map((expense) => {
    if (expense.id !== template.id) return expense;

    return {
      ...expense,
      recurrenceEndDate: earliestEndDate(expense.recurrenceEndDate, endDate),
    };
  });
}
