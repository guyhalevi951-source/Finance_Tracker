import { createContext } from 'react';
import { type AuthActionError, type AuthSession, type SignUpResult } from '../../types/auth';
import { type Result } from '../../types/result';

export interface AuthContextValue extends AuthSession {
  isLoading: boolean;
  migrationError: AuthActionError | null;
  signInWithPassword: (
    email: string,
    password: string,
    migrateGuest: boolean,
  ) => Promise<Result<void, AuthActionError>>;
  signUpWithPassword: (
    email: string,
    password: string,
    migrateGuest: boolean,
  ) => Promise<Result<SignUpResult, AuthActionError>>;
  signInWithGoogle: (migrateGuest: boolean) => Promise<Result<void, AuthActionError>>;
  signOut: () => Promise<Result<void, AuthActionError>>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
