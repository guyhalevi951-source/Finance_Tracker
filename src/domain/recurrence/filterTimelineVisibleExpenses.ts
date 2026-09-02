import { type Expense } from '../../types/expense';
import { isScheduledOneTimeExpense } from '../expenses/scheduled';
import { isRecurrenceDateExcluded } from './isRecurrenceDateExcluded';

export function shouldShowExpenseOnTimeline(expense: Expense): boolean {
  if (isScheduledOneTimeExpense(expense)) {
    return false;
  }
  if (expense.recurrenceRule !== undefined && isRecurrenceDateExcluded(expense, expense.date)) {
    return false;
  }
  return true;
}

export function filterTimelineVisibleExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter(shouldShowExpenseOnTimeline);
}
