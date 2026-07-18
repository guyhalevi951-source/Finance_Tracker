import { type Expense } from '../../types/expense';
import { type RecurrenceRule } from '../../types/recurrenceRule';

export function resolveRecurrenceRuleForExpense(
  expenses: Expense[],
  expense: Expense,
): RecurrenceRule | undefined {
  if (expense.recurrenceRule) {
    return expense.recurrenceRule;
  }

  if (expense.recurrenceSeriesId) {
    const template = expenses.find((item) => item.id === expense.recurrenceSeriesId);
    return template?.recurrenceRule;
  }

  return undefined;
}
