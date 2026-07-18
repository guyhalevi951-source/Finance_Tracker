/**
 * SSOT for Firestore collection paths.
 * Repositories must import paths from here — never hardcode collection names.
 */

export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  transactions: 'transactions',
  categories: 'categories',
  mainCategories: 'mainCategories',
  expenses: 'expenses',
  accounts: 'accounts',
  budgets: 'budgets',
  exchangeRates: 'exchangeRates',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
