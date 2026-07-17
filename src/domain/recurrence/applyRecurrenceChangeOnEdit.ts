import { type Expense } from '../../types/expense';
import { type RecurrenceRule } from '../../types/recurrenceRule';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';

function dayBefore(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() - 1);
  return toIsoDate(date);
}

function stripRecurrenceFields(expense: Expense): Expense {
  const { recurrenceRule, recurrenceSeriesId, recurrenceEndDate, ...rest } = expense;
  return rest;
}

function capTemplateEndDate(expense: Expense, endDate: string): Expense {
  return { ...expense, recurrenceEndDate: endDate };
}

function applyRecurrenceRule(expense: Expense, rule: RecurrenceRule): Expense {
  const { recurrenceSeriesId, recurrenceEndDate, ...rest } = expense;
  return { ...rest, recurrenceRule: rule };
}

/**
 * Applies a recurrence rule change from the edited expense forward.
 * Past instances before splitDate remain unchanged.
 */
export function applyRecurrenceChangeOnEdit(
  expenses: Expense[],
  editedExpense: Expense,
  newRule: RecurrenceRule | null,
): Expense[] {
  const splitDate = editedExpense.date;
  const isTemplate = editedExpense.recurrenceRule !== undefined;
  const seriesRootId = isTemplate ? editedExpense.id : editedExpense.recurrenceSeriesId;

  if (!seriesRootId) {
    if (!newRule) {
      return expenses.map((expense) =>
        expense.id === editedExpense.id ? stripRecurrenceFields(editedExpense) : expense,
      );
    }

    return expenses.map((expense) =>
      expense.id === editedExpense.id ? applyRecurrenceRule(editedExpense, newRule) : expense,
    );
  }

  const rootId = seriesRootId;

  if (!newRule) {
    if (isTemplate) {
      const updated = stripRecurrenceFields(editedExpense);
      return expenses
        .filter((expense) => expense.recurrenceSeriesId !== rootId)
        .map((expense) => (expense.id === editedExpense.id ? updated : expense));
    }

    const endDate = dayBefore(splitDate);
    const updated = stripRecurrenceFields(editedExpense);

    return expenses
      .filter(
        (expense) =>
          !(
            expense.recurrenceSeriesId === rootId &&
            expense.date >= splitDate &&
            expense.id !== editedExpense.id
          ),
      )
      .map((expense) => {
        if (expense.id === rootId) {
          return capTemplateEndDate(expense, endDate);
        }
        if (expense.id === editedExpense.id) {
          return updated;
        }
        return expense;
      });
  }

  if (isTemplate) {
    const updated = applyRecurrenceRule(editedExpense, newRule);

    return expenses
      .filter((expense) => !(expense.recurrenceSeriesId === rootId && expense.date > splitDate))
      .map((expense) => (expense.id === editedExpense.id ? updated : expense));
  }

  const endDate = dayBefore(splitDate);
  const updated = applyRecurrenceRule(editedExpense, newRule);

  return expenses
    .filter((expense) => !(expense.recurrenceSeriesId === rootId && expense.date > splitDate))
    .map((expense) => {
      if (expense.id === rootId) {
        return capTemplateEndDate(expense, endDate);
      }
      if (expense.id === editedExpense.id) {
        return updated;
      }
      return expense;
    });
}
