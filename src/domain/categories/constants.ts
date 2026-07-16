import { migrateToSubCategoryId } from './hierarchy';

/**
 * SSOT for category IDs used in domain logic and persistence.
 * Display labels for built-in categories live in i18n locale files under `category.*`.
 * Icons and colors are UI concerns and live in the presentation layer.
 */
export const BUILTIN_CATEGORY_IDS = [
  'food',
  'health',
  'entertainment',
  'rent',
  'other',
] as const;

export type BuiltinCategoryId = (typeof BUILTIN_CATEGORY_IDS)[number];

export { DEFAULT_SUB_CATEGORY_ID as DEFAULT_CATEGORY_ID } from './hierarchy';

/**
 * Maps legacy Hebrew category strings (stored in old localStorage data) to stable IDs.
 * Used at load time to migrate pre-i18n expense data.
 */
export const LEGACY_CATEGORY_MIGRATION: Record<string, BuiltinCategoryId> = {
  'אוכל': 'food',
  'בריאות': 'health',
  'בילויים': 'entertainment',
  'שכר דירה': 'rent',
  'אחר': 'other',
};

/** Returns the stable sub-category ID for a raw category value, migrating legacy data if needed. */
export function migrateCategoryId(raw: string): string {
  return migrateToSubCategoryId(raw, LEGACY_CATEGORY_MIGRATION);
}
