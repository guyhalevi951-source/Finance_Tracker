import { type CategoryCatalog } from '../../types/category';
import { type Expense } from '../../types/expense';
import { type BudgetProfileId } from '../../config/budgetProfile';
import {
  SUB_CATEGORY_DELETE_FALLBACK_ID,
} from '../../domain/categories/deleteSubCategory';
import { restoreMigratedExpensesOnCategoryReset } from '../../domain/categories/restoreExpensesOnCategoryReset';
import { applyExpenseBatch, loadExpenses } from '../expenses/expenseRepository';
import { resetCategoriesToDefaults } from './categoryRepository';

function mergeExpenseLists(stored: Expense[], live: Expense[]): Expense[] {
  const byId = new Map<string, Expense>();
  for (const expense of stored) byId.set(expense.id, expense);
  for (const expense of live) byId.set(expense.id, expense);
  return [...byId.values()];
}

export interface ResetCategoriesResult {
  catalog: CategoryCatalog;
  expenses: Expense[];
}

/**
 * Restores the factory category catalog, then reassigns Miscellaneous-migrated
 * expenses back to original default subcategories when those subs exist again.
 */
export async function resetCategoriesToDefaultsWithExpenseRestore(
  userId: string | null,
  profileId: BudgetProfileId,
  liveExpenses: Expense[],
): Promise<ResetCategoriesResult> {
  const catalog = await resetCategoriesToDefaults(userId, profileId);
  const storedExpenses = await loadExpenses(userId);
  const merged = mergeExpenseLists(storedExpenses, liveExpenses);
  const restoredExpenses = restoreMigratedExpensesOnCategoryReset(
    merged,
    catalog.subCategories,
    SUB_CATEGORY_DELETE_FALLBACK_ID,
  );

  const hasExpenseChanges = restoredExpenses.some(
    (expense, index) => expense !== merged[index],
  );
  if (hasExpenseChanges) {
    await applyExpenseBatch(userId, restoredExpenses);
  }

  return { catalog, expenses: restoredExpenses };
}
