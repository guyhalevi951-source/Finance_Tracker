import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { type AuthActionError } from '../../../types/auth';
import { useAuthSession } from '../hooks/useAuthSession';

const fieldClassName =
  'w-full min-h-11 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-base text-slate-800 dark:text-slate-100';
const primaryButtonClassName =
  'w-full min-h-11 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium';
const secondaryButtonClassName =
  'w-full min-h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-medium';

function errorMessageKey(error: AuthActionError): string {
  switch (error) {
    case 'INVALID_CREDENTIALS':
      return 'profile.auth.errors.invalidCredentials';
    case 'EMAIL_IN_USE':
      return 'profile.auth.errors.emailInUse';
    case 'WEAK_PASSWORD':
      return 'profile.auth.errors.weakPassword';
    case 'EMAIL_NOT_CONFIRMED':
      return 'profile.auth.errors.emailNotConfirmed';
    case 'GOOGLE_FAILED':
      return 'profile.auth.errors.googleFailed';
    case 'SIGN_OUT_FAILED':
      return 'profile.auth.errors.signOutFailed';
    case 'MIGRATION_FAILED':
      return 'profile.auth.errors.migrationFailed';
    case 'VALIDATION':
      return 'profile.auth.errors.validation';
    default:
      return 'profile.auth.errors.generic';
  }
}

export function AuthPanel() {
  const { t } = useTranslation();
  const {
    userId,
    displayName,
    email,
    migrationError,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    signOut,
  } = useAuthSession();

  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [busyAction, setBusyAction] = useState<'signIn' | 'signUp' | 'google' | 'signOut' | null>(
    null,
  );
  const [actionError, setActionError] = useState<AuthActionError | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const visibleError = actionError ?? migrationError;

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    const emailInput = emailValue.trim();
    if (!emailInput || !passwordValue) {
      setActionError('VALIDATION');
      return;
    }
    setBusyAction('signIn');
    setActionError(null);
    setNeedsEmailConfirmation(false);
    const result = await signInWithPassword(emailInput, passwordValue);
    if (!result.ok) setActionError(result.error);
    setBusyAction(null);
  }

  async function handleSignUp() {
    const emailInput = emailValue.trim();
    if (!emailInput || !passwordValue) {
      setActionError('VALIDATION');
      return;
    }
    setBusyAction('signUp');
    setActionError(null);
    const result = await signUpWithPassword(emailInput, passwordValue);
    if (!result.ok) {
      setActionError(result.error);
    } else {
      setNeedsEmailConfirmation(result.value.needsEmailConfirmation);
    }
    setBusyAction(null);
  }

  async function handleGoogle() {
    setBusyAction('google');
    setActionError(null);
    const result = await signInWithGoogle();
    if (!result.ok) setActionError(result.error);
    setBusyAction(null);
  }

  async function handleSignOut() {
    setBusyAction('signOut');
    setActionError(null);
    const result = await signOut();
    if (!result.ok) setActionError(result.error);
    setBusyAction(null);
  }

  if (userId) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
          {t('profile.auth.loggedInAs', {
            user: displayName ?? email ?? t('profile.defaultUserName'),
          })}
        </p>
        {email && email !== displayName && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{email}</p>
        )}
        {visibleError && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center" role="alert">
            {t(errorMessageKey(visibleError))}
          </p>
        )}
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={() => void handleSignOut()}
          disabled={busyAction !== null}
        >
          {t('profile.auth.signOut')}
        </button>
      </div>
    );
  }

  return (
    <form className="flex w-full flex-col gap-3" onSubmit={(event) => void handleSignIn(event)}>
      <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
        {t('profile.auth.guestMode')}
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('profile.auth.email')}
        </span>
        <input
          type="email"
          autoComplete="email"
          value={emailValue}
          onChange={(event) => setEmailValue(event.target.value)}
          className={fieldClassName}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {t('profile.auth.password')}
        </span>
        <input
          type="password"
          autoComplete="current-password"
          value={passwordValue}
          onChange={(event) => setPasswordValue(event.target.value)}
          className={fieldClassName}
        />
      </label>
      {visibleError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {t(errorMessageKey(visibleError))}
        </p>
      )}
      {needsEmailConfirmation && (
        <p className="text-sm text-slate-600 dark:text-slate-300" role="status">
          {t('profile.auth.checkEmail')}
        </p>
      )}
      <button type="submit" className={primaryButtonClassName} disabled={busyAction !== null}>
        {t('profile.auth.signIn')}
      </button>
      <button
        type="button"
        className={`${SEMANTIC_COLORS.interactive.text} min-h-11 font-medium`}
        onClick={() => void handleSignUp()}
        disabled={busyAction !== null}
      >
        {t('profile.auth.signUp')}
      </button>
      <p className="text-center text-xs uppercase tracking-wide text-slate-400">
        {t('profile.auth.or')}
      </p>
      <button
        type="button"
        className={secondaryButtonClassName}
        onClick={() => void handleGoogle()}
        disabled={busyAction !== null}
      >
        {t('profile.auth.continueWithGoogle')}
      </button>
    </form>
  );
}
