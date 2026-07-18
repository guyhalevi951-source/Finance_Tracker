import { type AppLocale } from '../../config/app';
import { type CategoryRecord, type CustomCategory } from '../../types/category';
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
export function resolveCategoryRecordLabel(
  id: string,
  records: CategoryRecord[],
  locale: AppLocale,
): string | null {
  const found = records.find((record) => record.id === id);
  return found ? resolveBilingualText(found.labels, locale) : null;
}

export function resolveCustomCategoryLabel(
  id: string,
  customCategories: CustomCategory[],
  locale: AppLocale,
): string | null {
  return resolveCategoryRecordLabel(id, customCategories, locale);
}

export function resolveSubCategoryLabel(
  subId: string,
  subCategories: CategoryRecord[],
  locale: AppLocale,
  t: (key: string) => string,
): string {
  const live = resolveCategoryRecordLabel(subId, subCategories, locale);
  if (live) return live;
  if (isBuiltinSubCategoryId(subId)) return t(getBuiltinCategoryI18nKey(subId));
  return t('category.sub.other.miscellaneous');
}

export function resolveMainCategoryLabel(
  mainId: string,
  mainCategories: CategoryRecord[],
  locale: AppLocale,
  t: (key: string) => string,
): string {
  const live = resolveCategoryRecordLabel(mainId, mainCategories, locale);
  if (live) return live;
  if (isBuiltinParentCategoryId(mainId)) return t(getBuiltinParentI18nKey(mainId));
  return t('category.parent.other');
}
