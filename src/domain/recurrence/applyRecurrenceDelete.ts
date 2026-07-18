import { type Expense } from '../../types/expense';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';
import { capTemplateEndDate } from './earliestEndDate';
import { mergeExcludedDates } from './isRecurrenceDateExcluded';

export type RecurrenceDeleteScope = 'instanceOnly' | 'thisAndFuture';

function dayBefore(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() - 1);
  return toIsoDate(date);
}

function addExcludedDateToTemplate(template: Expense, dateIso: string): Expense {
  return {
    ...template,
    recurrenceExcludedDates: mergeExcludedDates(template.recurrenceExcludedDates, dateIso),
  };
}

function applyThisAndFuture(
  expenses: Expense[],
  target: Expense,
  rootId: string,
  splitDate: string,
  isTemplate: boolean,
): Expense[] {
  const endDate = dayBefore(splitDate);

  return expenses
    .filter((expense) => {
      if (expense.id === target.id) return false;
      if (expense.recurrenceSeriesId === rootId && expense.date >= splitDate) return false;
      return true;
    })
    .map((expense) => {
      if (!isTemplate && expense.id === rootId) {
        return capTemplateEndDate(expense, endDate);
      }
      return expense;
    });
}

function promoteTemplateSuccessor(
  expenses: Expense[],
  template: Expense,
): Expense[] {
  const instances = expenses.filter(
    (expense) => expense.recurrenceSeriesId === template.id && expense.id !== template.id,
  );

  if (instances.length === 0) {
    return expenses.filter((expense) => expense.id !== template.id);
  }

  const successor = [...instances].sort((a, b) => a.date.localeCompare(b.date))[0];
  const excludedDates = mergeExcludedDates(template.recurrenceExcludedDates, template.date);
  const { recurrenceSeriesId, ...successorRest } = successor;

  const promotedSuccessor: Expense = {
    ...successorRest,
    recurrenceRule: template.recurrenceRule,
    ...(template.recurrenceEndDate ? { recurrenceEndDate: template.recurrenceEndDate } : {}),
    recurrenceExcludedDates: excludedDates,
  };

  return expenses
    .filter((expense) => expense.id !== template.id)
    .map((expense) => {
      if (expense.id === successor.id) {
        return promotedSuccessor;
      }
      if (expense.recurrenceSeriesId === template.id) {
        return { ...expense, recurrenceSeriesId: successor.id };
      }
      return expense;
    });
}

function applyInstanceOnly(
  expenses: Expense[],
  target: Expense,
  rootId: string,
  isTemplate: boolean,
): Expense[] {
  if (isTemplate) {
    return promoteTemplateSuccessor(expenses, target);
  }

  return expenses
    .filter((expense) => expense.id !== target.id)
    .map((expense) => {
      if (expense.id === rootId) {
        return addExcludedDateToTemplate(expense, target.date);
      }
      return expense;
    });
}

export function applyRecurrenceDelete(
  expenses: Expense[],
  target: Expense,
  scope: RecurrenceDeleteScope,
): Expense[] {
  const isTemplate = target.recurrenceRule !== undefined;
  const rootId = isTemplate ? target.id : target.recurrenceSeriesId;

  if (!rootId) {
    return expenses.filter((expense) => expense.id !== target.id);
  }

  const splitDate = target.date;

  if (scope === 'thisAndFuture') {
    return applyThisAndFuture(expenses, target, rootId, splitDate, isTemplate);
  }

  return applyInstanceOnly(expenses, target, rootId, isTemplate);
}
