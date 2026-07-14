import { useState, useEffect } from 'react';
import { subscribeAuthSession } from '../../../services/auth/authSessionService';

/**
 * Exposes the current Firebase Auth user ID reactively.
 * Returns null for guest (unauthenticated) users.
 */
export function useAuthSession(): { userId: string | null; isLoading: boolean } {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthSession((uid) => {
      setUserId(uid);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return { userId, isLoading };
}
