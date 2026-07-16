import { type AppLocale } from '../../config/app';
import { type CustomCategory } from '../../types/category';
import {
  getParentCategoryI18nKey,
  getSubCategoryI18nKey,
  isBuiltinParentCategoryId,
  isBuiltinSubCategoryId,
  type BuiltinParentCategoryId,
} from './hierarchy';
import { resolveBilingualText } from '../i18n/resolveBilingualText';

/** i18n key prefix for legacy flat built-in category labels, e.g. 'category.food' */
const BUILTIN_LABEL_PREFIX = 'category.';

export function getBuiltinCategoryI18nKey(id: string): string {
  if (isBuiltinSubCategoryId(id)) return getSubCategoryI18nKey(id);
  return `${BUILTIN_LABEL_PREFIX}${id}`;
}

export function getBuiltinParentI18nKey(parentId: BuiltinParentCategoryId): string {
  return getParentCategoryI18nKey(parentId);
}

export function isBuiltinCategoryId(id: string): boolean {
  return isBuiltinSubCategoryId(id) || isBuiltinParentCategoryId(id);
}

/**
 * Resolves a custom category label for a given locale.
 * Returns null if the id is not found among custom categories.
 */
export function resolveCustomCategoryLabel(
  id: string,
  customCategories: CustomCategory[],
  locale: AppLocale,
): string | null {
  const found = customCategories.find((c) => c.id === id);
  return found ? resolveBilingualText(found.labels, locale) : null;
}
