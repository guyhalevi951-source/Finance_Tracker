import { type AuthChangeEvent, type AuthError, type User } from '@supabase/supabase-js';
import { type AuthActionError, type AuthSession, type SignUpResult } from '../../types/auth';
import { Result, err, ok } from '../../types/result';
import { supabase } from '../supabase/client';
import { hasGuestFinanceData, migrateGuestData } from './migrateGuestData';

type AuthCallback = (session: AuthSession) => void;

let cachedSession: AuthSession = { userId: null, displayName: null, email: null };

function resolveDisplayName(user: User): string | null {
  const metadata = user.user_metadata;
  const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : '';
  const name = typeof metadata?.name === 'string' ? metadata.name.trim() : '';
  if (fullName) return fullName;
  if (name) return name;

  const email = user.email?.trim();
  if (email) return email.split('@')[0];
  return null;
}

export function toAuthSession(user: User | null): AuthSession {
  if (!user) {
    return { userId: null, displayName: null, email: null };
  }

  return {
    userId: user.id,
    displayName: resolveDisplayName(user),
    email: user.email?.trim() || null,
  };
}

function mapAuthError(error: AuthError, fallback: AuthActionError): AuthActionError {
  switch (error.code) {
    case 'invalid_credentials':
      return 'INVALID_CREDENTIALS';
    case 'user_already_exists':
    case 'email_exists':
      return 'EMAIL_IN_USE';
    case 'weak_password':
      return 'WEAK_PASSWORD';
    case 'email_not_confirmed':
      return 'EMAIL_NOT_CONFIRMED';
    default:
      return fallback;
  }
}

export async function resolveAuthState(
  event: AuthChangeEvent,
  user: User | null,
): Promise<{ session: AuthSession; migrationError: AuthActionError | null }> {
  let migrationError: AuthActionError | null = null;
  const shouldMigrate =
    Boolean(user) &&
    (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && hasGuestFinanceData()));

  if (user && shouldMigrate) {
    try {
      await migrateGuestData(user.id);
    } catch {
      migrationError = 'MIGRATION_FAILED';
    }
  }

  cachedSession = toAuthSession(user);
  return { session: cachedSession, migrationError };
}

/**
 * Subscribes to raw Supabase Auth events. Callers must await resolveAuthState
 * before publishing the session so guest migration can finish first.
 */
export function subscribeAuthStateChanges(
  callback: (event: AuthChangeEvent, user: User | null) => void,
): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}

/**
 * Subscribes to resolved auth sessions (no migration await).
 * Prefer AuthProvider + useAuthSession for UI.
 */
export function subscribeAuthSession(callback: AuthCallback): () => void {
  return subscribeAuthStateChanges((_event, user) => {
    cachedSession = toAuthSession(user);
    callback(cachedSession);
  });
}

export function getCurrentUserId(): string | null {
  return cachedSession.userId;
}

export function getCurrentAuthSession(): AuthSession {
  return cachedSession;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<Result<void, AuthActionError>> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return err(mapAuthError(error, 'SIGN_IN_FAILED'));
  return ok(undefined);
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<Result<SignUpResult, AuthActionError>> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return err(mapAuthError(error, 'SIGN_UP_FAILED'));
  return ok({ needsEmailConfirmation: Boolean(data.user) && !data.session });
}

export async function signInWithGoogle(): Promise<Result<void, AuthActionError>> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) return err('GOOGLE_FAILED');
  return ok(undefined);
}

export async function signOut(): Promise<Result<void, AuthActionError>> {
  const { error } = await supabase.auth.signOut();
  if (error) return err('SIGN_OUT_FAILED');
  cachedSession = { userId: null, displayName: null, email: null };
  return ok(undefined);
}
