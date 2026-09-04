import { ROUTES } from './routes';

/**
 * Primary sidebar navigation order (SSOT).
 * Profile and Settings are icon-only links in the sidebar utility row.
 */
export const NAV_ITEMS = [
  { id: 'expenses', path: ROUTES.expenses, end: false },
  { id: 'budget', path: ROUTES.budget, end: false },
] as const;

export type NavItemId = (typeof NAV_ITEMS)[number]['id'];
