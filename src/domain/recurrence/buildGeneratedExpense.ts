import { type Expense } from '../../types/expense';
import { generateExpenseId } from '../expenses/generateId';
import { resolveRecurrenceGenerationFields } from './applyRecurringSettingsFieldUpdate';

export function buildGeneratedExpense(template: Expense, occurrenceDateIso: string): Expense {
  const fields = resolveRecurrenceGenerationFields(template, occurrenceDateIso);

  return {
    id: generateExpenseId(),
    description: fields.description,
    amount: fields.amount,
    category: fields.category,
    date: occurrenceDateIso,
    paymentMethod: fields.paymentMethod,
    recurrenceSeriesId: template.id,
    ...(template.attachmentUrl ? { attachmentUrl: template.attachmentUrl } : {}),
  };
}

export function buildExistingOccurrenceKey(seriesId: string, dateIso: string): string {
  return `${seriesId}:${dateIso}`;
}

export function collectExistingOccurrenceKeys(expenses: Expense[]): Set<string> {
  const keys = new Set<string>();

  for (const expense of expenses) {
    keys.add(buildExistingOccurrenceKey(expense.id, expense.date));

    if (expense.recurrenceSeriesId) {
      keys.add(buildExistingOccurrenceKey(expense.recurrenceSeriesId, expense.date));
    }
  }

  return keys;
}
