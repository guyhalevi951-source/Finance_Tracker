import { type Expense } from '../../types/expense';
import { computeDueDates } from '../../domain/recurrence/computeDueDates';
import {
  buildExistingOccurrenceKey,
  buildGeneratedExpense,
  collectExistingOccurrenceKeys,
} from '../../domain/recurrence/buildGeneratedExpense';
import { saveExpense, loadExpenses } from '../expenses/expenseRepository';

export interface SyncRecurringExpensesResult {
  createdCount: number;
  expenses: Expense[];
}

export async function syncRecurringExpenses(
  userId: string | null,
  expenses: Expense[],
  todayIso: string,
): Promise<SyncRecurringExpensesResult> {
  const templates = expenses.filter((expense) => expense.recurrenceRule !== undefined);
  if (templates.length === 0) {
    return { createdCount: 0, expenses };
  }

  const existingKeys = collectExistingOccurrenceKeys(expenses);
  const toCreate: Expense[] = [];

  for (const template of templates) {
    const rule = template.recurrenceRule;
    if (!rule) continue;

    const dueDates = computeDueDates(template.date, rule, todayIso);

    for (const dueDate of dueDates) {
      const key = buildExistingOccurrenceKey(template.id, dueDate);
      if (existingKeys.has(key)) continue;

      const generated = buildGeneratedExpense(template, dueDate);
      toCreate.push(generated);
      existingKeys.add(key);
      existingKeys.add(buildExistingOccurrenceKey(generated.id, dueDate));
    }
  }

  if (toCreate.length === 0) {
    return { createdCount: 0, expenses };
  }

  for (const expense of toCreate) {
    await saveExpense(userId, expense);
  }

  const refreshed = await loadExpenses(userId);
  return { createdCount: toCreate.length, expenses: refreshed };
}
