import { type Expense, type RecurrencePendingBasicFields } from '../../types/expense';
import { type RecurringBasicFields } from './applyRecurringBasicFieldUpdate';
import { resolveSeriesRootId, resolveSeriesTemplate } from './resolveSeriesTemplate';
import { settingsRecurrenceEffectiveFromIso } from './settingsRecurrenceEffectiveFrom';

function toBasicFields(expense: Expense): RecurringBasicFields {
  return {
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    paymentMethod: expense.paymentMethod,
  };
}

function mergeBasicFields(expense: Expense, fields: RecurringBasicFields): Expense {
  return {
    ...expense,
    description: fields.description,
    amount: fields.amount,
    category: fields.category,
    paymentMethod: fields.paymentMethod,
  };
}

/**
 * Fields used when generating (or displaying) an occurrence on occurrenceDateIso.
 * Pending Settings updates win on/after their effectiveFromIso without materializing early.
 */
export function resolveRecurrenceGenerationFields(
  template: Expense,
  occurrenceDateIso: string,
): RecurringBasicFields {
  const pending = template.recurrencePendingBasicFields;
  if (pending && occurrenceDateIso >= pending.effectiveFromIso) {
    return {
      description: pending.description,
      amount: pending.amount,
      category: pending.category,
      paymentMethod: pending.paymentMethod,
    };
  }
  return toBasicFields(template);
}

/** Series display fields for Settings (pending update if scheduled). */
export function resolveSettingsSeriesDisplayFields(template: Expense): RecurringBasicFields {
  const pending = template.recurrencePendingBasicFields;
  if (pending) {
    return {
      description: pending.description,
      amount: pending.amount,
      category: pending.category,
      paymentMethod: pending.paymentMethod,
    };
  }
  return toBasicFields(template);
}

export function clearRecurrencePendingBasicFields(expense: Expense): Expense {
  if (!expense.recurrencePendingBasicFields) return expense;
  const { recurrencePendingBasicFields: _pending, ...rest } = expense;
  return rest;
}

/**
 * Profile Settings field edit: schedule changes from tomorrow onward.
 * Does not create or inject a tomorrow-dated expense row — sync materializes when that day arrives.
 */
export function applyRecurringSettingsFieldUpdate(
  expenses: Expense[],
  target: Expense,
  updatedFields: RecurringBasicFields,
  todayIso: string,
): Expense[] {
  const effectiveFromIso = settingsRecurrenceEffectiveFromIso(todayIso);
  const rootId = resolveSeriesRootId(target);
  const template = resolveSeriesTemplate(expenses, target) ?? target;

  if (!rootId || !template.recurrenceRule) {
    return expenses.map((expense) =>
      expense.id === target.id ? mergeBasicFields(expense, updatedFields) : expense,
    );
  }

  const pending: RecurrencePendingBasicFields = {
    effectiveFromIso,
    description: updatedFields.description,
    amount: updatedFields.amount,
    category: updatedFields.category,
    paymentMethod: updatedFields.paymentMethod,
  };

  return expenses.map((expense) => {
    if (expense.id === template.id) {
      return {
        ...expense,
        recurrencePendingBasicFields: pending,
      };
    }

    // Already-materialized rows on/after the effective date adopt the new fields.
    if (
      (expense.recurrenceSeriesId === rootId || expense.id === rootId) &&
      expense.date >= effectiveFromIso
    ) {
      return mergeBasicFields(expense, updatedFields);
    }

    return expense;
  });
}
