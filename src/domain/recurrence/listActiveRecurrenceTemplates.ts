import { type Expense } from '../../types/expense';
import { isActiveRecurrenceTemplate } from './isActiveRecurrenceTemplate';

export function listActiveRecurrenceTemplates(
  expenses: Expense[],
  todayIso: string,
): Expense[] {
  return expenses.filter(
    (expense) =>
      expense.recurrenceRule !== undefined &&
      isActiveRecurrenceTemplate(expense, expenses, todayIso),
  );
}
