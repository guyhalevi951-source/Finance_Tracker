import {
  type MainCategoryRecord,
  type SubCategoryRecord,
  type SubCategoryInput,
} from '../../types/category';
import { LEGACY_FLAT_TO_SUB_MIGRATION } from './hierarchy';

export type DeleteSubCategoryError = 'cannotDeleteLastSub';

export interface DeleteSubCategoryResult {
  subs: SubCategoryRecord[];
  fallbackCategoryId: string;
}

export const SUB_CATEGORY_DELETE_FALLBACK_ID = LEGACY_FLAT_TO_SUB_MIGRATION.other;

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
  _subs: SubCategoryRecord[],
): string {
  return SUB_CATEGORY_DELETE_FALLBACK_ID;
}

export function deleteSubCategoryPolicy(
  subs: SubCategoryRecord[],
  subId: string,
): DeleteSubCategoryResult | DeleteSubCategoryError {
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
