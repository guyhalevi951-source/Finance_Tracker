import { useState, useEffect, useRef, useCallback } from 'react';
import { loadBudget, saveBudget } from '../../../services/storage/budgetLocalStorage';
import { parseBudgetInput } from '../../../domain/budget/validateBudget';
import { type Expense } from '../../../types/expense';
import { BudgetSummary, computeBudgetSummary } from '../../../domain/budget/summary';

export interface UseBudgetTrackerReturn {
  budget: number;
  budgetInput: string;
  summary: BudgetSummary;
  showBudgetSaved: boolean;
  loadError: string | null;
  setBudgetInput: (value: string) => void;
  handleSetBudget: () => void;
}

export function useBudgetTracker(expenses: Expense[]): UseBudgetTrackerReturn {
  const [budget, setBudget] = useState<number>(0);
  const [budgetInput, setBudgetInput] = useState<string>('');
  const [showBudgetSaved, setShowBudgetSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const budgetSavedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const budgetResult = loadBudget();
    if (budgetResult.ok) {
      setBudget(budgetResult.value);
    } else if (budgetResult.error !== 'NOT_FOUND') {
      console.warn(`[useBudgetTracker] Could not load budget: ${budgetResult.error}`);
      setLoadError('budget');
    }
  }, []);

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

  const summary = computeBudgetSummary(
    budget,
    expenses.map((e) => e.amount),
  );

  return {
    budget,
    budgetInput,
    summary,
    showBudgetSaved,
    loadError,
    setBudgetInput,
    handleSetBudget,
  };
}
