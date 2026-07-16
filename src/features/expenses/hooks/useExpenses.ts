import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { validateExpenseInput, type NewExpenseInput } from '../../../domain/expenses/validateExpense';
import { generateExpenseId } from '../../../domain/expenses/generateId';
import { DEFAULT_CATEGORY_ID } from '../../../domain/categories/constants';
import { DEFAULT_PAYMENT_METHOD } from '../../../domain/expenses/paymentMethods';
import { toIsoDate } from '../../../domain/expenses/parseExpenseDate';
import { loadExpenses, saveExpense } from '../../../services/expenses/expenseRepository';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { type AppLocale } from '../../../config/app';

export interface UseExpensesReturn {
  expenses: Expense[];
  loadError: boolean;
  isAddingExpense: boolean;
  addExpenseError: string | null;
  newExpense: NewExpenseInput;
  setNewExpense: (value: NewExpenseInput) => void;
  addExpense: (e: React.FormEvent) => Promise<void>;
  reload: () => Promise<void>;
  clearAddExpenseError: () => void;
}

const defaultNewExpense = (): NewExpenseInput => ({
  description: '',
  amount: '',
  category: DEFAULT_CATEGORY_ID,
  paymentMethod: DEFAULT_PAYMENT_METHOD,
  date: toIsoDate(new Date()),
});

export function useExpenses(userId: string | null): UseExpensesReturn {
  const { i18n } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [newExpense, setNewExpense] = useState<NewExpenseInput>(defaultNewExpense());
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [addExpenseError, setAddExpenseError] = useState<string | null>(null);

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

  const addExpense = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateExpenseInput(newExpense);
    if (!result.ok) return;

    const { description, amount, category, paymentMethod, date } = result.value;
    setIsAddingExpense(true);
    setAddExpenseError(null);

    try {
      const locale = i18n.language as AppLocale;
      const bilingualDescription = await createBilingualText(description, locale);

      const expense: Expense = {
        id: generateExpenseId(),
        description: bilingualDescription,
        amount,
        category,
        date,
        paymentMethod: paymentMethod as Expense['paymentMethod'],
      };

      await saveExpense(userId, expense);
      await reload();
      setNewExpense(defaultNewExpense());
    } catch {
      setAddExpenseError('translationError');
    } finally {
      setIsAddingExpense(false);
    }
  }, [newExpense, i18n.language, userId, reload]);

  const clearAddExpenseError = useCallback(() => setAddExpenseError(null), []);

  return {
    expenses,
    loadError,
    isAddingExpense,
    addExpenseError,
    newExpense,
    setNewExpense,
    addExpense,
    reload,
    clearAddExpenseError,
  };
}
