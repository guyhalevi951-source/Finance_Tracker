import { type SubCategoryRecord } from '../../types/category';
import { type Expense, type RecurrencePendingBasicFields } from '../../types/expense';

function canRestoreToOriginalSub(
  currentCategory: string,
  originalSubCategoryId: string | undefined,
  originalCategoryId: string | undefined,
  fallbackCategoryId: string,
  restoredById: ReadonlyMap<string, SubCategoryRecord>,
): originalSubCategoryId is string {
  if (currentCategory !== fallbackCategoryId) return false;
  if (!originalSubCategoryId) return false;
  const restored = restoredById.get(originalSubCategoryId);
  if (!restored) return false;
  if (originalCategoryId && restored.parentId !== originalCategoryId) return false;
  return true;
}

function stripExpenseOrigin(expense: Expense): Expense {
  const { originalCategoryId: _main, originalSubCategoryId: _sub, ...rest } = expense;
  return rest;
}

function stripPendingOrigin(
  pending: RecurrencePendingBasicFields,
): RecurrencePendingBasicFields {
  const { originalCategoryId: _main, originalSubCategoryId: _sub, ...rest } = pending;
  return rest;
}

/**
 * After reset-to-defaults, move Miscellaneous-migrated expenses back to a
 * restored original subcategory and clear origin tracking fields.
 */
export function restoreMigratedExpensesOnCategoryReset(
  expenses: Expense[],
  restoredSubs: SubCategoryRecord[],
  fallbackCategoryId: string,
): Expense[] {
  const restoredById = new Map(restoredSubs.map((sub) => [sub.id, sub]));

  return expenses.map((expense) => {
    let next = expense;

    if (
      canRestoreToOriginalSub(
        expense.category,
        expense.originalSubCategoryId,
        expense.originalCategoryId,
        fallbackCategoryId,
        restoredById,
      )
    ) {
      const restoredSubId = expense.originalSubCategoryId;
      next = { ...stripExpenseOrigin(expense), category: restoredSubId };
    }

    const pending = next.recurrencePendingBasicFields;
    if (
      pending &&
      canRestoreToOriginalSub(
        pending.category,
        pending.originalSubCategoryId,
        pending.originalCategoryId,
        fallbackCategoryId,
        restoredById,
      )
    ) {
      const restoredSubId = pending.originalSubCategoryId;
      next = {
        ...next,
        recurrencePendingBasicFields: {
          ...stripPendingOrigin(pending),
          category: restoredSubId,
        },
      };
    }

    return next;
  });
}
