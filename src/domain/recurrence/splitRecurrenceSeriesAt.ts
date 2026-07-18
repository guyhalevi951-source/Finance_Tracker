import { type Expense } from '../../types/expense';
import { type RecurrenceRule } from '../../types/recurrenceRule';
import { isoDateToDate, toIsoDate } from '../expenses/parseExpenseDate';
import { capTemplateEndDate } from './earliestEndDate';

function dayBefore(iso: string): string {
  const date = isoDateToDate(iso);
  date.setDate(date.getDate() - 1);
  return toIsoDate(date);
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

export function splitRecurrenceSeriesAt(
  expenses: Expense[],
  template: Expense,
  updatedFields: Expense,
  newRule: RecurrenceRule | null,
  effectiveFromIso: string,
): Expense[] {
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
