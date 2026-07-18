import { type SubCategoryRecord } from '../../types/category';
import {
  getParentCategoryId as getStaticParentCategoryId,
  isBuiltinSubCategoryId,
} from './hierarchy';

/**
 * Resolves the parent main-category id for a leaf category id.
 * Prefers live sub-category records; falls back to static hierarchy for legacy ids.
 */
export function resolveParentCategoryId(
  categoryId: string,
  subCategories: SubCategoryRecord[],
): string {
  const liveSub = subCategories.find((sub) => sub.id === categoryId);
  if (liveSub) return liveSub.parentId;

  if (isBuiltinSubCategoryId(categoryId)) {
    return getStaticParentCategoryId(categoryId);
  }

  return getStaticParentCategoryId(categoryId);
}

export function getSubCategoriesForParentFromCatalog(
  subCategories: SubCategoryRecord[],
  parentId: string,
): SubCategoryRecord[] {
  return subCategories
    .filter((sub) => sub.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}
