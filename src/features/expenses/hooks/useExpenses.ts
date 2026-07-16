import { useState, useEffect, useCallback } from 'react';
import { type Expense } from '../../../types/expense';
import { loadExpenses, saveExpense } from '../../../services/expenses/expenseRepository';
import { syncRecurringExpenses } from '../../../services/recurrence/recurringExpenseSyncService';
import { useTodayIso } from '../../../lib/hooks/useTodayIso';

export interface UseExpensesReturn {
  expenses: Expense[];
  loadError: boolean;
  createExpense: (expense: Expense) => Promise<void>;
  reload: () => Promise<void>;
}

export function useExpenses(userId: string | null): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadError, setLoadError] = useState(false);
  const todayIso = useTodayIso();

  const reload = useCallback(async () => {
    try {
      const loaded = await loadExpenses(userId);
      const { expenses: synced } = await syncRecurringExpenses(userId, loaded, todayIso);
      setExpenses(synced);
      setLoadError(false);
    } catch {
      setLoadError(true);
      setExpenses([]);
    }
  }, [userId, todayIso]);

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
