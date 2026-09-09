import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearMonthBudgetAmount, upsertMonthBudgetEntry } from '../../../domain/budget/budgetStorePolicy';
import { canShowCarryOverCheckbox } from '../../../domain/budget/canShowCarryOverCheckbox';
import {
  type MonthBudgetSource,
  type ResolvedMonthBudget,
} from '../../../domain/budget/resolveMonthBudget';
import { parseBudgetInput } from '../../../domain/budget/validateBudget';
import { type BudgetStore } from '../../../types/budget';

const BUDGET_SAVED_FLASH_MS = 2000;

export interface MonthBudgetController {
  effectiveAmount: number;
  carryOverToNext: boolean;
  isExplicit: boolean;
  budgetSource: MonthBudgetSource;
  showCarryOverCheckbox: boolean;
  budgetInput: string;
  showBudgetSaved: boolean;
  setBudgetInput: (value: string) => void;
  handleSetBudget: () => void;
  handleCarryOverChange: (checked: boolean) => void;
  handleResetBudget: () => void;
}

export interface UseMonthBudgetControllerParams {
  store: BudgetStore;
  monthKey: string;
  /** Resolution policy for the month (master vs fixed budget) — decided by the caller's domain owner. */
  resolved: ResolvedMonthBudget;
  persistStore: (nextStore: BudgetStore) => void;
}

/**
 * Shared month-amount editing behaviour (input, save flash, carry-over, reset) over any
 * `BudgetStore`. Storage and resolution are injected so master and fixed budgets share
 * one controller without sharing a store.
 */
export function useMonthBudgetController({
  store,
  monthKey,
  resolved,
  persistStore,
}: UseMonthBudgetControllerParams): MonthBudgetController {
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetSaved, setShowBudgetSaved] = useState(false);
  const budgetSavedTimeoutRef = useRef<number | null>(null);

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

  const showCarryOverCheckbox = useMemo(
    () => canShowCarryOverCheckbox(store, monthKey),
    [store, monthKey],
  );

  const flashSaved = useCallback(() => {
    setShowBudgetSaved(true);
    if (budgetSavedTimeoutRef.current !== null) {
      clearTimeout(budgetSavedTimeoutRef.current);
    }
    budgetSavedTimeoutRef.current = window.setTimeout(() => {
      setShowBudgetSaved(false);
      budgetSavedTimeoutRef.current = null;
    }, BUDGET_SAVED_FLASH_MS);
  }, []);

  const handleSetBudget = useCallback(() => {
    const result = parseBudgetInput(budgetInput);
    if (!result.ok) return;

    const nextStore = upsertMonthBudgetEntry(store, monthKey, {
      amount: result.value,
      carryOverToNext: resolved.carryOverToNext,
    });
    persistStore(nextStore);
    setBudgetInput('');
    flashSaved();
  }, [budgetInput, store, monthKey, resolved.carryOverToNext, persistStore, flashSaved]);

  const handleCarryOverChange = useCallback(
    (checked: boolean) => {
      persistStore(upsertMonthBudgetEntry(store, monthKey, { carryOverToNext: checked }));
    },
    [store, monthKey, persistStore],
  );

  const handleResetBudget = useCallback(() => {
    persistStore(clearMonthBudgetAmount(store, monthKey));
    setBudgetInput('');
  }, [store, monthKey, persistStore]);

  return {
    effectiveAmount: resolved.amount,
    carryOverToNext: resolved.carryOverToNext,
    isExplicit: resolved.isExplicit,
    budgetSource: resolved.source,
    showCarryOverCheckbox,
    budgetInput,
    showBudgetSaved,
    setBudgetInput,
    handleSetBudget,
    handleCarryOverChange,
    handleResetBudget,
  };
}
