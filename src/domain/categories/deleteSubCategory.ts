import {
  type MainCategoryRecord,
  type SubCategoryRecord,
  type SubCategoryInput,
} from '../../types/category';
import { type Expense } from '../../types/expense';
import { LEGACY_FLAT_TO_SUB_MIGRATION } from './hierarchy';
import { PROTECTED_MAIN_CATEGORY_ID } from './reassignSubCategoriesOnDelete';

export type DeleteSubCategoryError = 'cannotDeleteLastSub' | 'cannotDeleteFallback';

export interface DeleteSubCategoryResult {
  subs: SubCategoryRecord[];
  fallbackCategoryId: string;
}

/** Stable ID for "אחר / שונות" (Other / Miscellaneous) — SSOT for expense reassignment on sub delete. */
export const SUB_CATEGORY_DELETE_FALLBACK_ID = LEGACY_FLAT_TO_SUB_MIGRATION.other;

export function isProtectedFallbackSubCategoryId(subId: string): boolean {
  return subId === SUB_CATEGORY_DELETE_FALLBACK_ID;
}

/**
 * Resolves the default "שונות" subcategory under the protected "אחר" main category.
 * Uses stable built-in IDs; validates the sub exists in the live catalog.
 */
export function resolveOtherMiscellaneousSubCategoryId(subs: SubCategoryRecord[]): string {
  const builtInFallback = subs.find(
    (sub) =>
      sub.parentId === PROTECTED_MAIN_CATEGORY_ID &&
      sub.id === SUB_CATEGORY_DELETE_FALLBACK_ID,
  );
  if (builtInFallback) {
    return builtInFallback.id;
  }

  const firstUnderOther = subs
    .filter((sub) => sub.parentId === PROTECTED_MAIN_CATEGORY_ID)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))[0];

  if (firstUnderOther) {
    return firstUnderOther.id;
  }

  return SUB_CATEGORY_DELETE_FALLBACK_ID;
}

export function buildNewSubCategory(
  input: SubCategoryInput,
  parentMain: MainCategoryRecord,
  subId: string,
  sortOrder: number,
  createdAt: string,
): SubCategoryRecord {
  return {
    id: subId,
    parentId: parentMain.id,
    labels: input.labels,
    icon: input.icon,
    color: parentMain.color,
    sortOrder,
    createdAt,
  };
}

export function reorderSubCategories(
  subs: SubCategoryRecord[],
  parentId: string,
  orderedIds: string[],
): SubCategoryRecord[] {
  const parentSubs = subs.filter((sub) => sub.parentId === parentId);
  const otherSubs = subs.filter((sub) => sub.parentId !== parentId);
  const byId = new Map(parentSubs.map((sub) => [sub.id, sub]));
  const reordered: SubCategoryRecord[] = [];

  for (const id of orderedIds) {
    const sub = byId.get(id);
    if (sub) reordered.push(sub);
  }

  for (const sub of parentSubs) {
    if (!orderedIds.includes(sub.id)) {
      reordered.push(sub);
    }
  }

  const withSortOrder = reordered.map((sub, index) => ({ ...sub, sortOrder: index }));
  return [...otherSubs, ...withSortOrder];
}

export function moveSubCategoryToParent(
  sub: SubCategoryRecord,
  newParent: MainCategoryRecord,
  subs: SubCategoryRecord[],
): SubCategoryRecord {
  const targetSortOrder = subs.filter((item) => item.parentId === newParent.id).length;
  return {
    ...sub,
    parentId: newParent.id,
    color: newParent.color,
    sortOrder: targetSortOrder,
  };
}

export function deleteSubCategoryFromCatalog(
  subs: SubCategoryRecord[],
  subId: string,
): SubCategoryRecord[] {
  return subs.filter((sub) => sub.id !== subId);
}

export function resolveSubCategoryDeleteFallback(
  _subId: string,
  subs: SubCategoryRecord[],
): string {
  return resolveOtherMiscellaneousSubCategoryId(subs);
}

export function expenseLinksToSubCategory(expense: Expense, subId: string): boolean {
  return (
    expense.category === subId ||
    expense.recurrencePendingBasicFields?.category === subId
  );
}

/** Reassigns expense.category (and pending recurrence category) to אחר / שונות. */
export function reassignExpensesOnSubCategoryDelete(
  expenses: Expense[],
  deletedSubId: string,
  fallbackCategoryId: string,
): Expense[] {
  if (deletedSubId === fallbackCategoryId) return expenses;

  return expenses.map((expense) => {
    if (!expenseLinksToSubCategory(expense, deletedSubId)) return expense;

    const pending = expense.recurrencePendingBasicFields;
    const nextPending = pending
      ? {
          ...pending,
          category: pending.category === deletedSubId ? fallbackCategoryId : pending.category,
        }
      : undefined;

    return {
      ...expense,
      category: expense.category === deletedSubId ? fallbackCategoryId : expense.category,
      ...(nextPending ? { recurrencePendingBasicFields: nextPending } : {}),
    };
  });
}

/** Built-in subs absent from the live catalog, excluding user-deleted ids. */
export function missingBuiltinSubsToRestore(
  seedSubs: SubCategoryRecord[],
  existingIds: ReadonlySet<string>,
  deletedIds: ReadonlySet<string>,
): SubCategoryRecord[] {
  return seedSubs.filter((sub) => !existingIds.has(sub.id) && !deletedIds.has(sub.id));
}

export function deleteSubCategoryPolicy(
  subs: SubCategoryRecord[],
  subId: string,
): DeleteSubCategoryResult | DeleteSubCategoryError {
  if (isProtectedFallbackSubCategoryId(subId)) {
    return 'cannotDeleteFallback';
  }

  const target = subs.find((sub) => sub.id === subId);
  if (!target) {
    return 'cannotDeleteLastSub';
  }

  const siblingCount = subs.filter((sub) => sub.parentId === target.parentId).length;
  if (siblingCount <= 1) {
    return 'cannotDeleteLastSub';
  }

  return {
    subs: deleteSubCategoryFromCatalog(subs, subId),
    fallbackCategoryId: resolveSubCategoryDeleteFallback(subId, subs),
  };
}
