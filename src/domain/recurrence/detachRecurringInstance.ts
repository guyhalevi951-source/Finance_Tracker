import { type Expense } from '../../types/expense';
import { computeDueDates } from './computeDueDates';
import { mergeExcludedDates } from './isRecurrenceDateExcluded';
import { resolveSeriesRootId, resolveSeriesTemplate } from './resolveSeriesTemplate';
import { stripRecurrenceFields } from './stripRecurrenceFields';

function spawnContinuationTemplate(target: Expense): Expense | null {
  const rule = target.recurrenceRule;
  if (!rule) return null;

  const dueDates = computeDueDates(target.date, rule, '2099-12-31');
  const nextDate = dueDates[0];
  if (!nextDate) return null;

  const carriedExcluded = (target.recurrenceExcludedDates ?? []).filter(
    (date) => date >= nextDate,
  );
  const excludedDates = mergeExcludedDates(carriedExcluded, target.date);

  const {
    recurrenceSeriesId: _seriesId,
    recurrencePendingBasicFields: _pending,
    ...rest
  } = target;

  return {
    ...rest,
    id: crypto.randomUUID(),
    date: nextDate,
    recurrenceRule: rule,
    ...(target.recurrenceEndDate ? { recurrenceEndDate: target.recurrenceEndDate } : {}),
    recurrenceExcludedDates: excludedDates,
  };
}

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
    const continuation = spawnContinuationTemplate(target);
    const next = expenses.map((expense) =>
      expense.id === target.id ? stripRecurrenceFields(expense) : expense,
    );
    return continuation ? next.concat(continuation) : next;
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
