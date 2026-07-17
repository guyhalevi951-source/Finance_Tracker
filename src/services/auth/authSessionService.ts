import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { type AuthSession } from '../../types/auth';

type AuthCallback = (session: AuthSession) => void;

function resolveDisplayName(user: User): string | null {
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  const email = user.email?.trim();
  if (email) {
    return email.split('@')[0];
  }

  return null;
}

function toAuthSession(user: User | null): AuthSession {
  if (!user) {
    return { userId: null, displayName: null };
  }

  return {
    userId: user.uid,
    displayName: resolveDisplayName(user),
  };
}

/**
 * Subscribes to Firebase Auth state changes.
 * Returns an unsubscribe function.
 */
export function subscribeAuthSession(callback: AuthCallback): () => void {
  return onAuthStateChanged(auth, (user: User | null) => {
    callback(toAuthSession(user));
  });
}

/**
 * Returns the current signed-in user ID synchronously, or null for guests.
 * Prefer subscribeAuthSession for reactive updates.
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

/**
 * Returns the current auth session synchronously.
 * Prefer subscribeAuthSession for reactive updates.
 */
export function getCurrentAuthSession(): AuthSession {
  return toAuthSession(auth.currentUser);
}
