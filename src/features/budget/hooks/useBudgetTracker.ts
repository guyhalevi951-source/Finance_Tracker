import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { BudgetSummary, computeBudgetSummary } from '../../../domain/budget/summary';
import { parseBudgetInput } from '../../../domain/budget/validateBudget';
import { validateExpenseInput, NewExpenseInput } from '../../../domain/expenses/validateExpense';
import { generateExpenseId } from '../../../domain/expenses/generateId';
import { DEFAULT_CATEGORY_ID } from '../../../domain/categories/constants';
import {
  loadBudget,
  loadExpenses,
  saveBudget,
  saveExpenses,
} from '../../../services/storage/budgetLocalStorage';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { type AppLocale } from '../../../config/app';
import { formatDateShort } from '../../../lib/format/formatDate';

export interface UseBudgetTrackerReturn {
  budget: number;
  budgetInput: string;
  expenses: Expense[];
  newExpense: NewExpenseInput;
  summary: BudgetSummary;
  showBudgetSaved: boolean;
  loadError: string | null;
  isAddingExpense: boolean;
  addExpenseError: string | null;
  setBudgetInput: (value: string) => void;
  setNewExpense: (value: NewExpenseInput) => void;
  handleSetBudget: () => void;
  handleAddExpense: (e: React.FormEvent) => Promise<void>;
  handleDeleteExpense: (id: string) => void;
  clearAddExpenseError: () => void;
}

export function useBudgetTracker(): UseBudgetTrackerReturn {
  const { i18n } = useTranslation();
  const [budget, setBudget] = useState<number>(0);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<NewExpenseInput>({
    description: '',
    amount: '',
    category: DEFAULT_CATEGORY_ID,
  });
  const [showBudgetSaved, setShowBudgetSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [addExpenseError, setAddExpenseError] = useState<string | null>(null);

  const budgetSavedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const budgetResult = loadBudget();
    if (budgetResult.ok) {
      setBudget(budgetResult.value);
    } else if (budgetResult.error !== 'NOT_FOUND') {
      console.warn(`[useBudgetTracker] Could not load budget: ${budgetResult.error}`);
      setLoadError('budget');
    }

    const expensesResult = loadExpenses();
    if (expensesResult.ok) {
      setExpenses(expensesResult.value);
    } else if (expensesResult.error !== 'NOT_FOUND') {
      console.warn(`[useBudgetTracker] Could not load expenses: ${expensesResult.error}`);
      setLoadError('expenses');
    }
  }, []);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    return () => {
      if (budgetSavedTimeoutRef.current !== null) {
        clearTimeout(budgetSavedTimeoutRef.current);
      }
    };
  }, []);

  const handleSetBudget = useCallback(() => {
    const result = parseBudgetInput(budgetInput);
    if (!result.ok) return;

    const amount = result.value;
    setBudget(amount);
    saveBudget(amount);
    setBudgetInput('');
    setShowBudgetSaved(true);

    if (budgetSavedTimeoutRef.current !== null) {
      clearTimeout(budgetSavedTimeoutRef.current);
    }
    budgetSavedTimeoutRef.current = window.setTimeout(() => {
      setShowBudgetSaved(false);
      budgetSavedTimeoutRef.current = null;
    }, 2000);
  }, [budgetInput]);

  const handleAddExpense = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateExpenseInput(newExpense);
    if (!result.ok) return;

    const { description, amount, category } = result.value;
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
        date: formatDateShort(new Date(), locale),
      };

      setExpenses((prev) => [expense, ...prev]);
      setNewExpense({ description: '', amount: '', category: DEFAULT_CATEGORY_ID });
    } catch {
      setAddExpenseError('translationError');
    } finally {
      setIsAddingExpense(false);
    }
  }, [newExpense, i18n.language]);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }, []);

  const clearAddExpenseError = useCallback(() => setAddExpenseError(null), []);

  const summary = computeBudgetSummary(
    budget,
    expenses.map((e) => e.amount),
  );

  return {
    budget,
    budgetInput,
    expenses,
    newExpense,
    summary,
    showBudgetSaved,
    loadError,
    isAddingExpense,
    addExpenseError,
    setBudgetInput,
    setNewExpense,
    handleSetBudget,
    handleAddExpense,
    handleDeleteExpense,
    clearAddExpenseError,
  };
}
