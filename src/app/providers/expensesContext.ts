import { createContext } from 'react';
import { type Expense } from '../../types/expense';

export interface ExpensesContextValue {
  expenses: Expense[];
  loadError: boolean;
  createExpense: (expense: Expense) => Promise<void>;
  reload: () => Promise<void>;
  replaceExpenses: (next: Expense[]) => void;
}

export const ExpensesContext = createContext<ExpensesContextValue | null>(null);
