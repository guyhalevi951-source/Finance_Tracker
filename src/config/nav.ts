import { ROUTES } from './routes';

/**
 * Primary sidebar navigation order (SSOT).
 *
 * Invariant: Settings is always last; Profile is always second-to-last.
 * New primary items must be appended before Profile.
 */
export const NAV_ITEMS = [
  { id: 'budget', path: ROUTES.budget, end: false },
  { id: 'expenses', path: ROUTES.expenses, end: false },
  { id: 'profile', path: ROUTES.profile, end: false },
  { id: 'settings', path: ROUTES.settings, end: false },
] as const;

export type NavItemId = (typeof NAV_ITEMS)[number]['id'];

export function isSettingsNavLast(items: readonly { id: string }[]): boolean {
  return items.length >= 1 && items[items.length - 1]?.id === 'settings';
}

export function isProfileNavSecondToLast(items: readonly { id: string }[]): boolean {
  return (
    items.length >= 2 &&
    items[items.length - 2]?.id === 'profile' &&
    items[items.length - 1]?.id === 'settings'
  );
}
