import { type Expense } from '../../types/expense';
import { isScheduledOneTimeExpense } from '../expenses/scheduled';
import { isRecurrenceDateExcluded } from './isRecurrenceDateExcluded';

export function shouldShowExpenseOnTimeline(expense: Expense, todayIso: string): boolean {
  if (expense.date > todayIso) {
    return false;
  }
  if (isScheduledOneTimeExpense(expense)) {
    return false;
  }
  if (expense.recurrenceRule !== undefined && isRecurrenceDateExcluded(expense, expense.date)) {
    return false;
  }
  return true;
}

export function filterTimelineVisibleExpenses(expenses: Expense[], todayIso: string): Expense[] {
  return expenses.filter((expense) => shouldShowExpenseOnTimeline(expense, todayIso));
}
