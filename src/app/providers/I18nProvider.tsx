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
  // #region agent log
  fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7dae'},body:JSON.stringify({sessionId:'ea7dae',runId:'pre-fix',hypothesisId:'G',location:'I18nProvider.tsx:beforeUseTranslation',message:'I18nProvider entered',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const { i18n } = useTranslation();
  // #region agent log
  fetch('http://127.0.0.1:7787/ingest/85325ec4-61eb-48fe-9ac8-a4df78cb3f3d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ea7dae'},body:JSON.stringify({sessionId:'ea7dae',runId:'pre-fix',hypothesisId:'G',location:'I18nProvider.tsx:afterUseTranslation',message:'useTranslation resolved',data:{language:i18n.language},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  useEffect(() => {
    const locale = i18n.language;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
    const appLocale = (locale === 'en' || locale === 'he' ? locale : DEFAULT_LOCALE) as AppLocale;
    document.title = APP_NAME[appLocale];
  }, [i18n.language]);

  return <>{children}</>;
}
