import { type Expense } from '../../types/expense';
import { sumAmounts } from '../money/arithmetic';
import { isoDateToDate } from './parseExpenseDate';

export interface ExpenseDateGroup {
  date: string;
  total: number;
  expenses: Expense[];
}

export function groupExpensesByDate(expenses: Expense[]): ExpenseDateGroup[] {
  const map = new Map<string, Expense[]>();

  for (const expense of expenses) {
    const existing = map.get(expense.date);
    if (existing) {
      existing.push(expense);
    } else {
      map.set(expense.date, [expense]);
    }
  }

  return Array.from(map.entries())
    .map(([date, groupExpenses]) => ({
      date,
      total: sumAmounts(groupExpenses.map((e) => e.amount)),
      expenses: [...groupExpenses].sort(
        (a, b) => isoDateToDate(b.date).getTime() - isoDateToDate(a.date).getTime() || b.id.localeCompare(a.id),
      ),
    }))
    .sort((a, b) => isoDateToDate(b.date).getTime() - isoDateToDate(a.date).getTime());
}
