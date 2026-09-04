import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clearMonthBudgetAmount, upsertMonthBudgetEntry } from '../../../domain/budget/budgetStorePolicy';

import { canShowCarryOverCheckbox } from '../../../domain/budget/canShowCarryOverCheckbox';

import { toMonthKey } from '../../../domain/budget/monthKey';

import { resolveMonthBudget, type MonthBudgetSource } from '../../../domain/budget/resolveMonthBudget';

import { parseBudgetInput } from '../../../domain/budget/validateBudget';

import { loadBudgetStore, saveBudgetStore } from '../../../services/storage/budgetLocalStorage';

import { type BudgetStore } from '../../../types/budget';



export interface UseMonthBudgetReturn {

  effectiveAmount: number;

  carryOverToNext: boolean;

  isExplicit: boolean;

  budgetSource: MonthBudgetSource;

  showCarryOverCheckbox: boolean;

  budgetInput: string;

  showBudgetSaved: boolean;

  loadError: string | null;

  setBudgetInput: (value: string) => void;

  handleSetBudget: () => void;

  handleCarryOverChange: (checked: boolean) => void;

  handleResetBudget: () => void;

}



function readInitialStore(): BudgetStore {

  const result = loadBudgetStore();

  return result.ok ? result.value : {};

}



export function useMonthBudget(year: number, month: number): UseMonthBudgetReturn {

  const [store, setStore] = useState<BudgetStore>(readInitialStore);

  const [budgetInput, setBudgetInput] = useState('');

  const [showBudgetSaved, setShowBudgetSaved] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);



  const budgetSavedTimeoutRef = useRef<number | null>(null);

  const monthKey = useMemo(() => toMonthKey(year, month), [year, month]);



  useEffect(() => {

    const result = loadBudgetStore();

    if (result.ok) {

      setStore((prev) => (Object.keys(prev).length === 0 ? result.value : prev));

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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'ea7dae' },
      body: JSON.stringify({
        sessionId: 'ea7dae',
        runId: 'carryover-default',
        hypothesisId: 'A',
        location: 'useMonthBudget.ts:resolved',
        message: 'month budget resolved',
        data: {
          monthKey,
          carryOverToNext: resolved.carryOverToNext,
          budgetSource: resolved.source,
          hasStoreEntry: monthKey in store,
          storeCarryOver: store[monthKey]?.carryOverToNext ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [monthKey, resolved.carryOverToNext, resolved.source, store]);
  // #endregion

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

    }, 2000);

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

      const nextStore = upsertMonthBudgetEntry(store, monthKey, { carryOverToNext: checked });

      persistStore(nextStore);

    },

    [store, monthKey, persistStore],

  );



  const handleResetBudget = useCallback(() => {

    const nextStore = clearMonthBudgetAmount(store, monthKey);

    persistStore(nextStore);

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

    loadError,

    setBudgetInput,

    handleSetBudget,

    handleCarryOverChange,

    handleResetBudget,

  };

}

