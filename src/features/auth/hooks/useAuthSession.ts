import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '../authContext';

/**
 * Exposes the current Supabase Auth session reactively.
 * Returns null userId for guest (unauthenticated) users.
 */
export function useAuthSession(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }
  return context;
}
