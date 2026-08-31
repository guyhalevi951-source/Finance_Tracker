import { useCallback } from 'react';
import { useAuthSession } from '../../auth/hooks/useAuthSession';
import { useCategories } from './useCategories';
import { useExpenses } from '../../expenses/hooks/useExpenses';

export function useSubCategoryDelete() {
  const { userId } = useAuthSession();
  const { deleteSubCategoryAction } = useCategories(userId);
  const { expenses, reload: reloadExpenses, replaceExpenses } = useExpenses();

  const deleteSubCategory = useCallback(
    async (subId: string): Promise<boolean> => {
      const updatedExpenses = await deleteSubCategoryAction(subId, expenses);
      if (!updatedExpenses) return false;

      replaceExpenses(updatedExpenses);
      await reloadExpenses();
      return true;
    },
    [deleteSubCategoryAction, expenses, reloadExpenses, replaceExpenses],
  );

  return { deleteSubCategory };
}
