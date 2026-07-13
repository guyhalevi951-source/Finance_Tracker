import { useState, useEffect, useRef, useCallback } from 'react';
import { Expense } from '../../../types/expense';
import { BudgetSummary, computeBudgetSummary } from '../../../domain/budget/summary';
import { parseBudgetInput } from '../../../domain/budget/validateBudget';
import { validateExpenseInput, NewExpenseInput } from '../../../domain/expenses/validateExpense';
import { generateExpenseId } from '../../../domain/expenses/generateId';
import { DEFAULT_CATEGORY } from '../../../domain/categories/constants';
import {
  loadBudget,
  loadExpenses,
  saveBudget,
  saveExpenses,
} from '../../../services/storage/budgetLocalStorage';

export interface UseBudgetTrackerReturn {
  budget: number;
  budgetInput: string;
  expenses: Expense[];
  newExpense: NewExpenseInput;
  summary: BudgetSummary;
  showBudgetSaved: boolean;
  loadError: string | null;
  setBudgetInput: (value: string) => void;
  setNewExpense: (value: NewExpenseInput) => void;
  handleSetBudget: () => void;
  handleAddExpense: (e: React.FormEvent) => void;
  handleDeleteExpense: (id: string) => void;
}

export function useBudgetTracker(): UseBudgetTrackerReturn {
  const [budget, setBudget] = useState<number>(0);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState<NewExpenseInput>({
    description: '',
    amount: '',
    category: DEFAULT_CATEGORY,
  });
  const [showBudgetSaved, setShowBudgetSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Bug 2 fix: store timeout ID so it can be cleaned up on unmount
  const budgetSavedTimeoutRef = useRef<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const budgetResult = loadBudget();
    if (budgetResult.ok) {
      setBudget(budgetResult.value);
    } else if (budgetResult.error !== 'NOT_FOUND') {
      // NOT_FOUND is normal (first visit); anything else is a data problem
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

  // Persist expenses whenever they change
  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  // Bug 2 fix: clear timeout on unmount
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

    // Bug 2 fix: cancel any prior pending timeout before starting a new one
    if (budgetSavedTimeoutRef.current !== null) {
      clearTimeout(budgetSavedTimeoutRef.current);
    }
    budgetSavedTimeoutRef.current = window.setTimeout(() => {
      setShowBudgetSaved(false);
      budgetSavedTimeoutRef.current = null;
    }, 2000);
  }, [budgetInput]);

  const handleAddExpense = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const result = validateExpenseInput(newExpense);
    if (!result.ok) return;

    const { description, amount, category } = result.value;
    const expense: Expense = {
      id: generateExpenseId(), // Bug 3 fix: collision-safe UUID
      description,
      amount,
      category,
      date: new Date().toLocaleDateString('he-IL'),
    };

    setExpenses((prev) => [expense, ...prev]);
    setNewExpense({ description: '', amount: '', category: DEFAULT_CATEGORY });
  }, [newExpense]);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }, []);

  // Bug 4 + 5 fix: computed via precision-safe domain function
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
    setBudgetInput,
    setNewExpense,
    handleSetBudget,
    handleAddExpense,
    handleDeleteExpense,
  };
}
