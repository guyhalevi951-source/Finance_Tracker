import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

type AuthCallback = (userId: string | null) => void;

/**
 * Subscribes to Firebase Auth state changes.
 * Returns an unsubscribe function.
 */
export function subscribeAuthSession(callback: AuthCallback): () => void {
  return onAuthStateChanged(auth, (user: User | null) => {
    callback(user?.uid ?? null);
  });
}

/**
 * Returns the current signed-in user ID synchronously, or null for guests.
 * Prefer subscribeAuthSession for reactive updates.
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}
