import { useTranslation } from 'react-i18next';
import {
  AUTH_TOGGLE_TAB_ACTIVE_CLASS,
  AUTH_TOGGLE_TAB_CLASS,
  AUTH_TOGGLE_TAB_INACTIVE_CLASS,
  AUTH_TOGGLE_TRACK_CLASS,
} from '../authFormStyles';

export type AuthFormMode = 'signIn' | 'signUp';

interface AuthModeToggleProps {
  mode: AuthFormMode;
  onModeChange: (mode: AuthFormMode) => void;
  disabled?: boolean;
}

type AuthTabLabelKey = 'profile.auth.loginTab' | 'profile.auth.signupTab';

const TABS: ReadonlyArray<{ mode: AuthFormMode; labelKey: AuthTabLabelKey }> = [
  { mode: 'signIn', labelKey: 'profile.auth.loginTab' },
  { mode: 'signUp', labelKey: 'profile.auth.signupTab' },
];

export function AuthModeToggle({ mode, onModeChange, disabled = false }: AuthModeToggleProps) {
  const { t } = useTranslation();

  return (
    <div role="tablist" className={AUTH_TOGGLE_TRACK_CLASS}>
      {TABS.map((tab) => {
        const isActive = mode === tab.mode;
        return (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onModeChange(tab.mode)}
            className={`${AUTH_TOGGLE_TAB_CLASS} ${
              isActive ? AUTH_TOGGLE_TAB_ACTIVE_CLASS : AUTH_TOGGLE_TAB_INACTIVE_CLASS
            }`}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
