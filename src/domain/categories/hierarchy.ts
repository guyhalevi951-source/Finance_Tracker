/**
 * SSOT for 2-level built-in category hierarchy.
 * Expenses persist a leaf sub-category ID (e.g. 'food.groceries').
 * Parent IDs are used for grouping and icon/color resolution only.
 */

export const BUILTIN_PARENT_CATEGORY_IDS = [
  'food',
  'transport',
  'housing',
  'health',
  'shopping',
  'entertainment',
  'lifestyle',
  'other',
] as const;

export type BuiltinParentCategoryId = (typeof BUILTIN_PARENT_CATEGORY_IDS)[number];

const SUB_CATEGORIES_BY_PARENT: Record<BuiltinParentCategoryId, readonly string[]> = {
  food: ['groceries', 'restaurants', 'delivery', 'snacks', 'alcohol'],
  transport: ['publicTransit', 'car', 'fuel', 'taxi'],
  housing: ['rent', 'utilities', 'maintenance', 'homeGoods'],
  health: ['medical', 'pharmacy', 'fitness', 'beauty'],
  shopping: ['clothing', 'electronics', 'gifts', 'general'],
  entertainment: ['movies', 'events', 'hobbies', 'subscriptions', 'travel'],
  lifestyle: ['education', 'pets', 'donations', 'social', 'kids'],
  other: ['miscellaneous', 'cigarettes', 'lottery', 'phone'],
};

/** Maps legacy flat built-in IDs to default sub-category IDs. */
export const LEGACY_FLAT_TO_SUB_MIGRATION: Record<string, string> = {
  food: 'food.groceries',
  health: 'health.medical',
  entertainment: 'entertainment.events',
  rent: 'housing.rent',
  other: 'other.miscellaneous',
};

export const DEFAULT_SUB_CATEGORY_ID = 'food.groceries';

function buildSubId(parent: BuiltinParentCategoryId, sub: string): string {
  return `${parent}.${sub}`;
}

const ALL_BUILTIN_SUB_CATEGORY_IDS: string[] = BUILTIN_PARENT_CATEGORY_IDS.flatMap((parent) =>
  SUB_CATEGORIES_BY_PARENT[parent].map((sub) => buildSubId(parent, sub)),
);

const SUB_TO_PARENT = new Map<string, BuiltinParentCategoryId>(
  BUILTIN_PARENT_CATEGORY_IDS.flatMap((parent) =>
    SUB_CATEGORIES_BY_PARENT[parent].map((sub) => [buildSubId(parent, sub), parent] as const),
  ),
);

export function getSubCategoriesForParent(parentId: BuiltinParentCategoryId): string[] {
  return SUB_CATEGORIES_BY_PARENT[parentId].map((sub) => buildSubId(parentId, sub));
}

export function getAllBuiltinSubCategoryIds(): string[] {
  return [...ALL_BUILTIN_SUB_CATEGORY_IDS];
}

export function isBuiltinParentCategoryId(id: string): id is BuiltinParentCategoryId {
  return (BUILTIN_PARENT_CATEGORY_IDS as readonly string[]).includes(id);
}

export function isBuiltinSubCategoryId(id: string): boolean {
  return SUB_TO_PARENT.has(id);
}

export function getParentCategoryId(categoryId: string): BuiltinParentCategoryId {
  const parent = SUB_TO_PARENT.get(categoryId);
  if (parent) return parent;

  const migrated = LEGACY_FLAT_TO_SUB_MIGRATION[categoryId];
  if (migrated) {
    const migratedParent = SUB_TO_PARENT.get(migrated);
    if (migratedParent) return migratedParent;
  }

  return 'other';
}

/** i18n key for a sub-category label, e.g. 'category.sub.food.groceries' */
export function getSubCategoryI18nKey(subId: string): string {
  return `category.sub.${subId}`;
}

/** i18n key for a parent category label, e.g. 'category.parent.food' */
export function getParentCategoryI18nKey(parentId: BuiltinParentCategoryId): string {
  return `category.parent.${parentId}`;
}

/**
 * Normalizes any raw category value to a sub-category ID when possible.
 * Legacy flat IDs and Hebrew strings are migrated; custom UUIDs pass through.
 */
export function migrateToSubCategoryId(raw: string, legacyHebrewMap: Record<string, string>): string {
  const fromHebrew = legacyHebrewMap[raw];
  const flatId = fromHebrew ?? raw;

  if (isBuiltinSubCategoryId(flatId)) return flatId;

  const fromFlat = LEGACY_FLAT_TO_SUB_MIGRATION[flatId];
  if (fromFlat) return fromFlat;

  return flatId;
}
