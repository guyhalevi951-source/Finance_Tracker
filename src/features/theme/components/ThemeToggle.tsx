import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HEADER_ICON_BUTTON_CLASS } from '../../../app/components/headerIconButton';
import { useTheme } from '../hooks/useTheme';

/**
 * Icon-only theme toggle: Sun in light mode, Moon in dark mode.
 * Min 44px touch target, placed next to LanguageToggle in the header.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      aria-label={t('theme.toggle')}
      className={HEADER_ICON_BUTTON_CLASS}
    >
      {theme === 'dark' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
