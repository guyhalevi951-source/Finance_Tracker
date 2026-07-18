import { type Expense } from '../../types/expense';
import { countThisAndFutureDeleteOccurrences } from './countThisAndFutureDeleteOccurrences';
import { isRecurringExpense } from './isRecurringExpense';

export function requiresRecurringDeletePrompt(
  expenses: Expense[],
  target: Expense,
  todayIso: string,
): boolean {
  if (!isRecurringExpense(target)) {
    return false;
  }

  const count = countThisAndFutureDeleteOccurrences(expenses, target, todayIso);
  return count > 1;
}
