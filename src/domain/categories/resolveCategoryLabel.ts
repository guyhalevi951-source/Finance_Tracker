import { type AppLocale } from '../../config/app';
import { type CustomCategory } from '../../types/category';
import { type BuiltinCategoryId, BUILTIN_CATEGORY_IDS } from './constants';
import { resolveBilingualText } from '../i18n/resolveBilingualText';

/** i18n key prefix for built-in category labels, e.g. 'category.food' */
const BUILTIN_LABEL_PREFIX = 'category.';

/**
 * Returns the display label for a category ID in the given locale.
 * For built-in IDs, returns the i18n key string so the caller can pass it to `t()`.
 * For custom categories, resolves the BilingualText directly.
 */
export function getBuiltinCategoryI18nKey(id: BuiltinCategoryId): string {
  return `${BUILTIN_LABEL_PREFIX}${id}`;
}

export function isBuiltinCategoryId(id: string): id is BuiltinCategoryId {
  return (BUILTIN_CATEGORY_IDS as readonly string[]).includes(id);
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
