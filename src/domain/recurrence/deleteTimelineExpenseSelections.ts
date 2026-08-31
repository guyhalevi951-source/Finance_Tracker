import { type Expense } from '../../types/expense';
import { sortExpensesByDateDescending } from '../expenses/sortExpensesByDateDescending';
import { isRecurringExpense } from './isRecurringExpense';
import { mergeExcludedDates } from './isRecurrenceDateExcluded';
import { resolveSeriesTemplate } from './resolveSeriesTemplate';

function excludeOccurrenceDateOnTemplate(template: Expense, dateIso: string): Expense {
  return {
    ...template,
    recurrenceExcludedDates: mergeExcludedDates(template.recurrenceExcludedDates, dateIso),
  };
}

export function deleteTimelineExpenseInstance(expenses: Expense[], target: Expense): Expense[] {
  if (!isRecurringExpense(target)) {
    return expenses.filter((expense) => expense.id !== target.id);
  }

  if (target.recurrenceRule !== undefined) {
    return expenses.map((expense) =>
      expense.id === target.id ? excludeOccurrenceDateOnTemplate(expense, target.date) : expense,
    );
  }

  const template = resolveSeriesTemplate(expenses, target);
  if (!template) {
    return expenses.filter((expense) => expense.id !== target.id);
  }

  return expenses
    .filter((expense) => expense.id !== target.id)
    .map((expense) =>
      expense.id === template.id ? excludeOccurrenceDateOnTemplate(expense, target.date) : expense,
    );
}

export function deleteTimelineExpenseSelections(
  expenses: Expense[],
  selectedIds: Set<string>,
): Expense[] {
  const selected = expenses.filter((expense) => selectedIds.has(expense.id));
  let next = expenses;

  for (const target of sortExpensesByDateDescending(selected)) {
    const resolved = next.find((expense) => expense.id === target.id);
    if (resolved) {
      next = deleteTimelineExpenseInstance(next, resolved);
    }
  }

  return next;
}
