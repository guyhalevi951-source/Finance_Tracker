export type AuthSession = {
  userId: string | null;
  displayName: string | null;
  email: string | null;
};

export type AuthActionError =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_IN_USE'
  | 'WEAK_PASSWORD'
  | 'EMAIL_NOT_CONFIRMED'
  | 'SIGN_IN_FAILED'
  | 'SIGN_UP_FAILED'
  | 'SIGN_OUT_FAILED'
  | 'GOOGLE_FAILED'
  | 'MIGRATION_FAILED'
  | 'VALIDATION';

export type SignUpResult = {
  needsEmailConfirmation: boolean;
};
