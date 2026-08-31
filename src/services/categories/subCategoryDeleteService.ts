import { type SubCategoryRecord } from '../../types/category';
import { type Expense } from '../../types/expense';
import {
  deleteSubCategoryPolicy,
  expenseLinksToSubCategory,
  reassignExpensesOnSubCategoryDelete,
} from '../../domain/categories/deleteSubCategory';
import { applyExpenseBatch, loadExpenses } from '../expenses/expenseRepository';
import {
  deleteSubCategory,
  rememberDeletedSubCategory,
  saveSubCategories,
} from './categoryRepository';

export type SubCategoryDeleteError = 'cannotDeleteLastSub' | 'cannotDeleteFallback' | 'deleteFailed';

export type SubCategoryDeleteResult =
  | { ok: true; updatedSubs: SubCategoryRecord[]; updatedExpenses: Expense[]; reassignedCount: number }
  | { ok: false; error: SubCategoryDeleteError };

function mergeExpenseLists(stored: Expense[], live: Expense[]): Expense[] {
  const byId = new Map<string, Expense>();
  for (const expense of stored) byId.set(expense.id, expense);
  for (const expense of live) byId.set(expense.id, expense);
  return [...byId.values()];
}

/**
 * Deletes a subcategory after reassigning linked expenses to "אחר / שונות" (other.miscellaneous).
 * SSOT orchestration for subcategory deletion only — not used for main category delete.
 */
export async function deleteSubCategoryWithExpenseReassignment(
  userId: string | null,
  subCategories: SubCategoryRecord[],
  subId: string,
  liveExpenses: Expense[],
): Promise<SubCategoryDeleteResult> {
  const policyResult = deleteSubCategoryPolicy(subCategories, subId);
  if (typeof policyResult === 'string') {
    return { ok: false, error: policyResult };
  }

    const deletedSub = subCategories.find((sub) => sub.id === subId);
    const parentId = deletedSub?.parentId;
    const fallbackCategoryId = policyResult.fallbackCategoryId;

    try {
      const storedExpenses = await loadExpenses(userId);
      const merged = mergeExpenseLists(storedExpenses, liveExpenses);
      const updatedExpenses = reassignExpensesOnSubCategoryDelete(
        merged,
        subId,
        deletedSub?.parentId ?? '',
        fallbackCategoryId,
      );
    const reassignedCount = merged.filter((expense) =>
      expenseLinksToSubCategory(expense, subId),
    ).length;

    if (reassignedCount > 0) {
      await applyExpenseBatch(userId, updatedExpenses);
    }

    await deleteSubCategory(userId, subId);
    await rememberDeletedSubCategory(userId, subId);

    if (parentId) {
      const remaining = policyResult.subs.filter((sub) => sub.parentId === parentId);
      await saveSubCategories(userId, remaining);
    }

    return { ok: true, updatedSubs: policyResult.subs, updatedExpenses, reassignedCount };
  } catch {
    return { ok: false, error: 'deleteFailed' };
  }
}
