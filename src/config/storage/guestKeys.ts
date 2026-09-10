/**
 * SSOT for guest localStorage finance keys.
 * Locale and theme stay on-device and are not part of this set.
 */

export const GUEST_FINANCE_STORAGE_KEYS = {
  expenses: 'expenses',
  subBudgets: 'subBudgets',
  monthlyBudgetStore: 'monthlyBudgetStore',
  monthlyBudgetLegacy: 'monthlyBudget',
  expenseAttachments: 'expenseAttachments',
  activeBudgetId: 'activeBudgetId',
} as const;

export const GUEST_CATEGORY_KEY_PREFIXES = [
  'mainCategories:',
  'customCategories:',
  'deletedSubCategoryIds:',
] as const;

export const GUEST_LEGACY_CATEGORY_KEYS = [
  'mainCategories',
  'customCategories',
  'deletedSubCategoryIds',
] as const;
