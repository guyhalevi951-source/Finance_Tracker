import { useState, useEffect } from 'react';
import { subscribeAuthSession } from '../../../services/auth/authSessionService';
import { type AuthSession } from '../../../types/auth';

/**
 * Exposes the current Firebase Auth session reactively.
 * Returns null userId for guest (unauthenticated) users.
 */
export function useAuthSession(): AuthSession & { isLoading: boolean } {
  const [session, setSession] = useState<AuthSession>({ userId: null, displayName: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthSession((nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return { ...session, isLoading };
}
