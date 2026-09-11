import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { type AuthActionError } from '../../../types/auth';
import {
  AUTH_DIVIDER_LINE_CLASS,
  AUTH_GOOGLE_BUTTON_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  AUTH_SIGNED_IN_SECONDARY_BUTTON_CLASS,
} from '../authFormStyles';
import { useAuthSession } from '../hooks/useAuthSession';
import { AuthIconField } from './AuthIconField';
import { AuthModeToggle, type AuthFormMode } from './AuthModeToggle';
import { GoogleMark } from './GoogleMark';

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

  const [mode, setMode] = useState<AuthFormMode>('signIn');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [migrateGuest, setMigrateGuest] = useState(true);
  const [busyAction, setBusyAction] = useState<'signIn' | 'signUp' | 'google' | 'signOut' | null>(
    null,
  );
  const [actionError, setActionError] = useState<AuthActionError | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const visibleError = actionError ?? migrationError;
  const isBusy = busyAction !== null;

  async function handleSignIn() {
    const emailInput = emailValue.trim();
    if (!emailInput || !passwordValue) {
      setActionError('VALIDATION');
      return;
    }
    setBusyAction('signIn');
    setActionError(null);
    setNeedsEmailConfirmation(false);
    const result = await signInWithPassword(emailInput, passwordValue, migrateGuest);
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
    const result = await signUpWithPassword(emailInput, passwordValue, migrateGuest);
    if (!result.ok) {
      setActionError(result.error);
    } else {
      setNeedsEmailConfirmation(result.value.needsEmailConfirmation);
    }
    setBusyAction(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === 'signIn') {
      await handleSignIn();
      return;
    }
    await handleSignUp();
  }

  async function handleGoogle() {
    setBusyAction('google');
    setActionError(null);
    const result = await signInWithGoogle(migrateGuest);
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
          className={AUTH_SIGNED_IN_SECONDARY_BUTTON_CLASS}
          onClick={() => void handleSignOut()}
          disabled={isBusy}
        >
          {t('profile.auth.signOut')}
        </button>
      </div>
    );
  }

  return (
    <form className="flex w-full flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
      <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
        {t('profile.auth.guestMode')}
      </p>
      <AuthModeToggle mode={mode} onModeChange={setMode} disabled={isBusy} />
      <AuthIconField
        type="email"
        value={emailValue}
        onChange={setEmailValue}
        placeholder={t('profile.auth.email')}
        ariaLabel={t('profile.auth.email')}
        autoComplete="email"
        disabled={isBusy}
      />
      <AuthIconField
        type="password"
        value={passwordValue}
        onChange={setPasswordValue}
        placeholder={t('profile.auth.password')}
        ariaLabel={t('profile.auth.password')}
        autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
        disabled={isBusy}
      />
      {mode === 'signUp' && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {t('profile.auth.passwordMinLengthHint')}
        </p>
      )}
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
      <button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS} disabled={isBusy}>
        {mode === 'signIn' ? t('profile.auth.signIn') : t('profile.auth.signUp')}
      </button>
      <div className="flex items-center gap-3">
        <div className={AUTH_DIVIDER_LINE_CLASS} />
        <span className="text-sm text-slate-400">{t('profile.auth.or')}</span>
        <div className={AUTH_DIVIDER_LINE_CLASS} />
      </div>
      <button
        type="button"
        dir="ltr"
        className={AUTH_GOOGLE_BUTTON_CLASS}
        onClick={() => void handleGoogle()}
        disabled={isBusy}
      >
        <GoogleMark />
        {t('profile.auth.continueWithGoogle')}
      </button>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={migrateGuest}
          onChange={(event) => setMigrateGuest(event.target.checked)}
          className="h-5 w-5 shrink-0 rounded border-slate-300 dark:border-slate-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-200">
          {t('profile.auth.transferGuestData')}
        </span>
      </label>
    </form>
  );
}
