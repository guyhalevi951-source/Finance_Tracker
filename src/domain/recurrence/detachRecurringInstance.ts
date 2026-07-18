import { type Expense } from '../../types/expense';
import { mergeExcludedDates } from './isRecurrenceDateExcluded';
import { resolveSeriesRootId, resolveSeriesTemplate } from './resolveSeriesTemplate';
import { stripRecurrenceFields } from './stripRecurrenceFields';

function detachMaterializedInstance(
  expenses: Expense[],
  target: Expense,
  rootId: string,
): Expense[] {
  return expenses.map((expense) => {
    if (expense.id === target.id) {
      return stripRecurrenceFields(expense);
    }
    if (expense.id === rootId) {
      return {
        ...expense,
        recurrenceExcludedDates: mergeExcludedDates(expense.recurrenceExcludedDates, target.date),
      };
    }
    return expense;
  });
}

function detachTemplateRow(expenses: Expense[], target: Expense): Expense[] {
  const instances = expenses.filter(
    (expense) => expense.recurrenceSeriesId === target.id && expense.id !== target.id,
  );

  if (instances.length === 0) {
    return expenses.map((expense) =>
      expense.id === target.id ? stripRecurrenceFields(expense) : expense,
    );
  }

  const successor = [...instances].sort((a, b) => a.date.localeCompare(b.date))[0];
  const excludedDates = mergeExcludedDates(target.recurrenceExcludedDates, target.date);
  const { recurrenceSeriesId, ...successorRest } = successor;

  const promotedSuccessor: Expense = {
    ...successorRest,
    recurrenceRule: target.recurrenceRule,
    ...(target.recurrenceEndDate ? { recurrenceEndDate: target.recurrenceEndDate } : {}),
    recurrenceExcludedDates: excludedDates,
  };

  return expenses.map((expense) => {
    if (expense.id === target.id) {
      return stripRecurrenceFields(expense);
    }
    if (expense.id === successor.id) {
      return promotedSuccessor;
    }
    if (expense.recurrenceSeriesId === target.id) {
      return { ...expense, recurrenceSeriesId: successor.id };
    }
    return expense;
  });
}

export function detachRecurringInstance(expenses: Expense[], target: Expense): Expense[] {
  const rootId = resolveSeriesRootId(target);

  if (!rootId) {
    return expenses.map((expense) =>
      expense.id === target.id ? stripRecurrenceFields(expense) : expense,
    );
  }

  if (target.recurrenceRule !== undefined) {
    return detachTemplateRow(expenses, target);
  }

  const template = resolveSeriesTemplate(expenses, target);
  if (!template) {
    return expenses.map((expense) =>
      expense.id === target.id ? stripRecurrenceFields(expense) : expense,
    );
  }

  return detachMaterializedInstance(expenses, target, template.id);
}
