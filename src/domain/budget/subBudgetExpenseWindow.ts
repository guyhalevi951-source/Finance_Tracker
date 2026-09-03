import { type Expense } from '../../types/expense';
import { type SubBudgetRecord } from '../../types/budget';
import { finalizeRecurrenceSchedule } from '../recurrence/finalizeRecurrenceSchedule';
import { earliestEndDate } from '../recurrence/earliestEndDate';
import { isDateWithinSubBudget } from './validateSubBudget';

export interface SubBudgetWindow {
  startDate: string;
  endDate: string;
}

export function resolveSubBudgetWindow(
  subBudgets: SubBudgetRecord[],
  budgetId: string | undefined,
): SubBudgetWindow | null {
  if (!budgetId) return null;
  const budget = subBudgets.find((item) => item.id === budgetId);
  if (!budget) return null;
  return { startDate: budget.startDate, endDate: budget.endDate };
}

export function resolveSubBudgetEndDate(
  subBudgets: SubBudgetRecord[],
  budgetId: string | undefined,
): string | undefined {
  return resolveSubBudgetWindow(subBudgets, budgetId)?.endDate;
}

export function resolveEffectiveRecurrenceEndDate(
  template: Expense,
  subBudgetEndDate: string | undefined,
): string | undefined {
  if (!template.budgetId || !subBudgetEndDate) {
    return template.recurrenceEndDate;
  }
  return earliestEndDate(template.recurrenceEndDate, subBudgetEndDate);
}

export function capExpenseRecurrenceToSubBudgetEnd(
  expense: Expense,
  endDate: string,
): Expense {
  if (!expense.recurrenceRule) return expense;
  const result = finalizeRecurrenceSchedule(expense, { capEndDateIso: endDate });
  return result.ok ? result.expense : expense;
}

export function capExpensesRecurrenceToSubBudgetEnd(
  expenses: Expense[],
  budgetId: string,
  endDate: string,
): Expense[] {
  return expenses.map((expense) =>
    expense.budgetId === budgetId && expense.recurrenceRule
      ? capExpenseRecurrenceToSubBudgetEnd(expense, endDate)
      : expense,
  );
}

export function isDateWithinSubBudgetWindow(
  dateIso: string,
  window: SubBudgetWindow,
): boolean {
  return isDateWithinSubBudget(dateIso, window.startDate, window.endDate);
}
