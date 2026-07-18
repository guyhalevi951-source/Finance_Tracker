import { type Expense } from '../../types/expense';

export function resolveSeriesTemplate(
  expenses: Expense[],
  target: Expense,
): Expense | undefined {
  const isTemplate = target.recurrenceRule !== undefined;
  const rootId = isTemplate ? target.id : target.recurrenceSeriesId;

  if (!rootId) {
    return undefined;
  }

  if (isTemplate) {
    return target;
  }

  return expenses.find((expense) => expense.id === rootId);
}

export function resolveSeriesRootId(target: Expense): string | undefined {
  if (target.recurrenceRule !== undefined) {
    return target.id;
  }
  return target.recurrenceSeriesId;
}
