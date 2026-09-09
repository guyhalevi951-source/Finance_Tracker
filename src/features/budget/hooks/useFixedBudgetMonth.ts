import { useCallback, useMemo } from 'react';
import { resolveFixedBudgetMonthAmount } from '../../../domain/budget/fixedBudgetMonth';
import { toMonthKey } from '../../../domain/budget/monthKey';
import { type BudgetStore, type FixedSubBudgetRecord } from '../../../types/budget';
import { useBudgets } from './useBudgets';
import { useMonthBudgetController, type MonthBudgetController } from './useMonthBudgetController';

/**
 * Fixed sub-budget month editing: overrides live on the budget record (`monthOverrides`)
 * and default to `totalAmount`; persistence goes through the budgets provider/repository.
 */
export function useFixedBudgetMonth(
  budget: FixedSubBudgetRecord,
  year: number,
  month: number,
): MonthBudgetController {
  const { updateFixedBudgetMonthOverrides } = useBudgets();
  const monthKey = useMemo(() => toMonthKey(year, month), [year, month]);

  const resolved = useMemo(
    () => resolveFixedBudgetMonthAmount(budget, monthKey),
    [budget, monthKey],
  );

  const persistStore = useCallback(
    (nextStore: BudgetStore) => {
      void updateFixedBudgetMonthOverrides(budget.id, nextStore);
    },
    [budget.id, updateFixedBudgetMonthOverrides],
  );

  return useMonthBudgetController({
    store: budget.monthOverrides,
    monthKey,
    resolved,
    persistStore,
  });
}
