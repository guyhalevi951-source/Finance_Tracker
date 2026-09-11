/** SSOT for whether the next SIGNED_IN event should copy guest localStorage to Supabase. */

export const MIGRATE_GUEST_ON_SIGN_IN_KEY = 'migrateGuestOnSignIn';

export function setMigrateGuestOnSignIn(enabled: boolean): void {
  sessionStorage.setItem(MIGRATE_GUEST_ON_SIGN_IN_KEY, enabled ? 'true' : 'false');
}

/** Reads and removes the flag so a later page refresh cannot re-run migration. */
export function consumeMigrateGuestOnSignIn(): boolean {
  const raw = sessionStorage.getItem(MIGRATE_GUEST_ON_SIGN_IN_KEY);
  sessionStorage.removeItem(MIGRATE_GUEST_ON_SIGN_IN_KEY);
  return raw === 'true';
}
