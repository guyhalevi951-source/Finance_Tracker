import { type Expense } from '../../types/expense';
import { generateExpenseId } from '../expenses/generateId';

export function buildGeneratedExpense(template: Expense, occurrenceDateIso: string): Expense {
  return {
    id: generateExpenseId(),
    description: template.description,
    amount: template.amount,
    category: template.category,
    date: occurrenceDateIso,
    paymentMethod: template.paymentMethod,
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
