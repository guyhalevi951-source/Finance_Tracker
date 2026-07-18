import { type Expense } from '../../types/expense';
import { type RecurrenceRule } from '../../types/recurrenceRule';
import { recurrenceRulesEqual } from './recurrenceRulesEqual';
import { splitRecurrenceSeriesAt } from './splitRecurrenceSeriesAt';

export function applyRecurrenceSeriesSettingsEdit(
  expenses: Expense[],
  template: Expense,
  updatedFields: Expense,
  newRule: RecurrenceRule | null,
  effectiveFromIso: string,
): Expense[] {
  const oldRule = template.recurrenceRule ?? null;
  const ruleChanged = !recurrenceRulesEqual(oldRule, newRule);

  if (!ruleChanged) {
    return expenses.map((expense) =>
      expense.id === template.id ? { ...expense, ...updatedFields, id: template.id } : expense,
    );
  }

  return splitRecurrenceSeriesAt(
    expenses,
    template,
    updatedFields,
    newRule,
    effectiveFromIso,
  );
}
