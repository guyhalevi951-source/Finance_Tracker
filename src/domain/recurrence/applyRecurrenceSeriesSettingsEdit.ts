import { type Expense } from '../../types/expense';
import { type RecurrenceRule } from '../../types/recurrenceRule';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';

function dayBefore(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() - 1);
  return toIsoDate(date);
}

function capTemplateEndDate(expense: Expense, endDate: string): Expense {
  const existing = expense.recurrenceEndDate;
  const cappedEndDate =
    existing && existing < endDate ? existing : endDate;
  return { ...expense, recurrenceEndDate: cappedEndDate };
}

function rulesEqual(a: RecurrenceRule | null, b: RecurrenceRule | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;

  return (
    a.type === b.type &&
    a.interval === b.interval &&
    a.occurrences === b.occurrences &&
    JSON.stringify(a.customDays ?? []) === JSON.stringify(b.customDays ?? [])
  );
}

function buildNewTemplate(
  updatedFields: Expense,
  newRule: RecurrenceRule | null,
  effectiveFromIso: string,
  excludedDates: string[] | undefined,
): Expense {
  const {
    recurrenceRule: _rule,
    recurrenceSeriesId: _seriesId,
    recurrenceEndDate: _endDate,
    recurrenceExcludedDates: _excluded,
    ...rest
  } = updatedFields;

  const base: Expense = {
    ...rest,
    id: crypto.randomUUID(),
    date: effectiveFromIso,
  };

  if (newRule === null) {
    return base;
  }

  return {
    ...base,
    recurrenceRule: newRule,
    ...(excludedDates && excludedDates.length > 0
      ? { recurrenceExcludedDates: excludedDates }
      : {}),
  };
}

export function applyRecurrenceSeriesSettingsEdit(
  expenses: Expense[],
  template: Expense,
  updatedFields: Expense,
  newRule: RecurrenceRule | null,
  effectiveFromIso: string,
): Expense[] {
  const oldRule = template.recurrenceRule ?? null;
  const ruleChanged = !rulesEqual(oldRule, newRule);

  if (!ruleChanged) {
    return expenses.map((expense) =>
      expense.id === template.id ? { ...expense, ...updatedFields, id: template.id } : expense,
    );
  }

  const endDate = dayBefore(effectiveFromIso);
  const cappedTemplate = capTemplateEndDate(template, endDate);
  const newTemplate = buildNewTemplate(
    updatedFields,
    newRule,
    effectiveFromIso,
    template.recurrenceExcludedDates,
  );

  return expenses
    .map((expense) => (expense.id === template.id ? cappedTemplate : expense))
    .concat(newTemplate);
}
