import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_NAME, DEFAULT_LOCALE, type AppLocale } from '../../config/app';
import '../../i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * Syncs document.documentElement lang and dir attributes whenever the active
 * locale changes. Must wrap the app root so all children see the correct
 * text direction.
 */
export function I18nProvider({ children }: I18nProviderProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const locale = i18n.language;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
    const appLocale = (locale === 'en' || locale === 'he' ? locale : DEFAULT_LOCALE) as AppLocale;
    document.title = APP_NAME[appLocale];
  }, [i18n.language]);

  return <>{children}</>;
}
