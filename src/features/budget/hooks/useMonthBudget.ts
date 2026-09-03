import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { upsertMonthBudgetEntry } from '../../../domain/budget/budgetStorePolicy';
import { toMonthKey } from '../../../domain/budget/monthKey';
import { resolveMonthBudget } from '../../../domain/budget/resolveMonthBudget';
import { parseBudgetInput } from '../../../domain/budget/validateBudget';
import { loadBudgetStore, saveBudgetStore } from '../../../services/storage/budgetLocalStorage';
import { type BudgetStore } from '../../../types/budget';

export interface UseMonthBudgetReturn {
  effectiveAmount: number;
  carryOverToNext: boolean;
  isExplicit: boolean;
  budgetInput: string;
  showBudgetSaved: boolean;
  loadError: string | null;
  setBudgetInput: (value: string) => void;
  handleSetBudget: () => void;
  handleCarryOverChange: (checked: boolean) => void;
}

export function useMonthBudget(year: number, month: number): UseMonthBudgetReturn {
  const [store, setStore] = useState<BudgetStore>({});
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetSaved, setShowBudgetSaved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const budgetSavedTimeoutRef = useRef<number | null>(null);
  const monthKey = useMemo(() => toMonthKey(year, month), [year, month]);

  useEffect(() => {
    const result = loadBudgetStore();
    if (result.ok) {
      setStore(result.value);
    } else {
      console.warn(`[useMonthBudget] Could not load budget store: ${result.error}`);
      setLoadError('budget');
    }
  }, []);

  useEffect(() => {
    setBudgetInput('');
  }, [monthKey]);

  useEffect(() => {
    return () => {
      if (budgetSavedTimeoutRef.current !== null) {
        clearTimeout(budgetSavedTimeoutRef.current);
      }
    };
  }, []);

  const persistStore = useCallback((nextStore: BudgetStore) => {
    setStore(nextStore);
    saveBudgetStore(nextStore);
  }, []);

  const resolved = useMemo(() => resolveMonthBudget(store, monthKey), [store, monthKey]);

  const flashSaved = useCallback(() => {
    setShowBudgetSaved(true);
    if (budgetSavedTimeoutRef.current !== null) {
      clearTimeout(budgetSavedTimeoutRef.current);
    }
    budgetSavedTimeoutRef.current = window.setTimeout(() => {
      setShowBudgetSaved(false);
      budgetSavedTimeoutRef.current = null;
    }, 2000);
  }, []);

  const handleSetBudget = useCallback(() => {
    const result = parseBudgetInput(budgetInput);
    if (!result.ok) return;

    const nextStore = upsertMonthBudgetEntry(store, monthKey, { amount: result.value });
    persistStore(nextStore);
    setBudgetInput('');
    flashSaved();
  }, [budgetInput, store, monthKey, persistStore, flashSaved]);

  const handleCarryOverChange = useCallback(
    (checked: boolean) => {
      const nextStore = upsertMonthBudgetEntry(store, monthKey, { carryOverToNext: checked });
      persistStore(nextStore);
    },
    [store, monthKey, persistStore],
  );

  return {
    effectiveAmount: resolved.amount,
    carryOverToNext: resolved.carryOverToNext,
    isExplicit: resolved.isExplicit,
    budgetInput,
    showBudgetSaved,
    loadError,
    setBudgetInput,
    handleSetBudget,
    handleCarryOverChange,
  };
}
