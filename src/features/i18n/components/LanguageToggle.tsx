import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HEADER_ICON_BUTTON_CLASS } from '../../../app/components/headerIconButton';
import { changeLanguage } from '../../../i18n';
import { type AppLocale } from '../../../config/app';

/**
 * Globe icon button that toggles between English and Hebrew.
 * Min 44px touch target, visible at all breakpoints.
 */
export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const currentLocale = i18n.language as AppLocale;
  const nextLocale: AppLocale = currentLocale === 'he' ? 'en' : 'he';

  return (
    <button
      onClick={() => changeLanguage(nextLocale)}
      aria-label={t('language.toggle')}
      className={HEADER_ICON_BUTTON_CLASS}
    >
      <Globe className="w-5 h-5" />
    </button>
  );
}
