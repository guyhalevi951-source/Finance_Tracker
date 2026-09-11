import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext, type AuthContextValue } from '../../features/auth/authContext';
import {
  resolveAuthState,
  signInWithGoogle as signInWithGoogleService,
  signInWithPassword as signInWithPasswordService,
  signOut as signOutService,
  signUpWithPassword as signUpWithPasswordService,
  subscribeAuthStateChanges,
} from '../../services/auth/authSessionService';
import { type AuthActionError, type AuthSession } from '../../types/auth';

const EMPTY_SESSION: AuthSession = { userId: null, displayName: null, email: null };

export type { AuthContextValue };

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { t } = useTranslation();
  const [session, setSession] = useState<AuthSession>(EMPTY_SESSION);
  const [isLoading, setIsLoading] = useState(true);
  const [migrationError, setMigrationError] = useState<AuthActionError | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuthStateChanges((event, user) => {
      window.setTimeout(() => {
        void (async () => {
          const resolved = await resolveAuthState(event, user);
          setSession(resolved.session);
          setMigrationError(event === 'SIGNED_OUT' ? null : resolved.migrationError);
          setIsLoading(false);
        })();
      }, 0);
    });
    return unsubscribe;
  }, []);

  const signInWithPassword = useCallback(
    (email: string, password: string, migrateGuest: boolean) =>
      signInWithPasswordService(email, password, migrateGuest),
    [],
  );
  const signUpWithPassword = useCallback(
    (email: string, password: string, migrateGuest: boolean) =>
      signUpWithPasswordService(email, password, migrateGuest),
    [],
  );
  const signInWithGoogle = useCallback(
    (migrateGuest: boolean) => signInWithGoogleService(migrateGuest),
    [],
  );
  const signOut = useCallback(() => signOutService(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...session,
      isLoading,
      migrationError,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [
      session,
      isLoading,
      migrationError,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    ],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <p className="text-base text-slate-600 dark:text-slate-300">
          {t('profile.auth.sessionLoading')}
        </p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
