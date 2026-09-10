/**
 * SSOT for Supabase table names.
 * Repositories must import paths from here — never hardcode table names.
 */

export const SUPABASE_TABLES = {
  budgets: 'budgets',
  expenses: 'expenses',
  monthlyBudgetEntries: 'monthly_budget_entries',
  categories: 'categories',
  deletedSubcategories: 'deleted_subcategories',
  userPrefs: 'user_prefs',
} as const;

export type SupabaseTableName = (typeof SUPABASE_TABLES)[keyof typeof SUPABASE_TABLES];
