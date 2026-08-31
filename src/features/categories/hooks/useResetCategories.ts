import { useCallback } from 'react';
import { useAuthSession } from '../../auth/hooks/useAuthSession';
import { useCategories } from './useCategories';
import { useExpenses } from '../../expenses/hooks/useExpenses';

export function useResetCategories() {
  const { userId } = useAuthSession();
  const { resetCategoriesToDefaultsAction, isResettingCategories } = useCategories(userId);
  const { expenses, reload: reloadExpenses, replaceExpenses } = useExpenses();

  const resetCategories = useCallback(async (): Promise<boolean> => {
    const restoredExpenses = await resetCategoriesToDefaultsAction(expenses);
    if (!restoredExpenses) return false;

    replaceExpenses(restoredExpenses);
    await reloadExpenses();
    return true;
  }, [resetCategoriesToDefaultsAction, expenses, reloadExpenses, replaceExpenses]);

  return { resetCategories, isResettingCategories };
}
