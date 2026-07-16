import { useState, useEffect, useCallback } from 'react';
import { type Expense } from '../../../types/expense';
import { loadExpenses, saveExpense } from '../../../services/expenses/expenseRepository';

export interface UseExpensesReturn {
  expenses: Expense[];
  loadError: boolean;
  createExpense: (expense: Expense) => Promise<void>;
  reload: () => Promise<void>;
}

export function useExpenses(userId: string | null): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadError, setLoadError] = useState(false);

  const reload = useCallback(async () => {
    try {
      const loaded = await loadExpenses(userId);
      setExpenses(loaded);
      setLoadError(false);
    } catch {
      setLoadError(true);
      setExpenses([]);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createExpense = useCallback(async (expense: Expense) => {
    await saveExpense(userId, expense);
    await reload();
  }, [userId, reload]);

  return {
    expenses,
    loadError,
    createExpense,
    reload,
  };
}
