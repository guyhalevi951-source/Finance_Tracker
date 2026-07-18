import { type Expense } from '../../types/expense';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';
import { isActiveRecurrenceTemplate } from './isActiveRecurrenceTemplate';

function dayBefore(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() - 1);
  return toIsoDate(date);
}

/**
 * After a this-and-future basic-field update, returns the expense row that should
 * own attachment storage for today and future occurrences.
 */
export function resolveThisAndFutureAttachmentTarget(
  expenses: Expense[],
  editedTemplate: Expense,
  splitDateIso: string,
): Expense {
  const updatedOriginal =
    expenses.find((expense) => expense.id === editedTemplate.id) ?? editedTemplate;

  if (
    updatedOriginal.recurrenceRule !== undefined &&
    isActiveRecurrenceTemplate(updatedOriginal, expenses, splitDateIso)
  ) {
    return updatedOriginal;
  }

  const splitEndDate = dayBefore(splitDateIso);
  if (updatedOriginal.recurrenceEndDate !== splitEndDate) {
    return updatedOriginal;
  }

  const candidates = expenses.filter(
    (expense) =>
      expense.recurrenceRule !== undefined &&
      expense.date === splitDateIso &&
      expense.id !== editedTemplate.id,
  );

  if (candidates.length === 1) {
    return candidates[0];
  }

  const bySeriesLink = candidates.find((candidate) =>
    expenses.some(
      (expense) =>
        expense.recurrenceSeriesId === candidate.id &&
        expense.date >= splitDateIso &&
        expense.id !== candidate.id,
    ),
  );

  return bySeriesLink ?? candidates[0] ?? updatedOriginal;
}
