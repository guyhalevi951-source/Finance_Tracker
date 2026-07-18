import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type Expense } from '../../types/expense';
import { loadExpenses, saveExpense } from '../../services/expenses/expenseRepository';
import { syncRecurringExpenses } from '../../services/recurrence/recurringExpenseSyncService';
import { useAuthSession } from '../../features/auth/hooks/useAuthSession';
import { useTodayIso } from '../../lib/hooks/useTodayIso';

export interface ExpensesContextValue {
  expenses: Expense[];
  loadError: boolean;
  createExpense: (expense: Expense) => Promise<void>;
  reload: () => Promise<void>;
}

export const ExpensesContext = createContext<ExpensesContextValue | null>(null);

interface ExpensesProviderProps {
  children: ReactNode;
}

export function ExpensesProvider({ children }: ExpensesProviderProps) {
  const { userId } = useAuthSession();
  const todayIso = useTodayIso();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadError, setLoadError] = useState(false);

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

  const createExpense = useCallback(
    async (expense: Expense) => {
      await saveExpense(userId, expense);
      await reload();
    },
    [userId, reload],
  );

  const value = useMemo(
    () => ({
      expenses,
      loadError,
      createExpense,
      reload,
    }),
    [expenses, loadError, createExpense, reload],
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}
