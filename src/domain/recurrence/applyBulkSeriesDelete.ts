import { type Expense } from '../../types/expense';
import { sortExpensesByDateDescending } from '../expenses/sortExpensesByDateDescending';
import { applyRecurrenceDelete } from './applyRecurrenceDelete';

export type BulkSeriesDeleteScope =
  | 'selectedOnly'
  | 'selectedPlusFutureFromLatest'
  | 'fromEarliestSelected';

function sortExpensesByDateAscending(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => a.date.localeCompare(b.date));
}

function resolveTargetInDraft(expenses: Expense[], target: Expense): Expense {
  return expenses.find((expense) => expense.id === target.id) ?? target;
}

function applySelectedOnly(expenses: Expense[], selectedInSeries: Expense[]): Expense[] {
  let next = expenses;

  for (const selected of sortExpensesByDateDescending(selectedInSeries)) {
    const target = resolveTargetInDraft(next, selected);
    next = applyRecurrenceDelete(next, target, 'instanceOnly');
  }

  return next;
}

function applySelectedPlusFutureFromLatest(
  expenses: Expense[],
  selectedInSeries: Expense[],
): Expense[] {
  const sortedDesc = sortExpensesByDateDescending(selectedInSeries);
  const latest = sortedDesc[0];
  let next = applyRecurrenceDelete(expenses, resolveTargetInDraft(expenses, latest), 'thisAndFuture');

  for (const selected of sortedDesc.slice(1)) {
    const target = resolveTargetInDraft(next, selected);
    if (next.some((expense) => expense.id === target.id)) {
      next = applyRecurrenceDelete(next, target, 'instanceOnly');
    }
  }

  return next;
}

function applyFromEarliestSelected(expenses: Expense[], selectedInSeries: Expense[]): Expense[] {
  const earliest = sortExpensesByDateAscending(selectedInSeries)[0];
  return applyRecurrenceDelete(
    expenses,
    resolveTargetInDraft(expenses, earliest),
    'thisAndFuture',
  );
}

export function applyBulkSeriesDelete(
  expenses: Expense[],
  selectedInSeries: Expense[],
  scope: BulkSeriesDeleteScope,
): Expense[] {
  if (selectedInSeries.length < 2) {
    throw new Error('applyBulkSeriesDelete requires at least two selected expenses in the same series');
  }

  switch (scope) {
    case 'selectedOnly':
      return applySelectedOnly(expenses, selectedInSeries);
    case 'selectedPlusFutureFromLatest':
      return applySelectedPlusFutureFromLatest(expenses, selectedInSeries);
    case 'fromEarliestSelected':
      return applyFromEarliestSelected(expenses, selectedInSeries);
  }
}
