import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
      className="flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-300 transition-all text-slate-600 hover:text-emerald-700 text-sm font-medium shadow-sm"
    >
      <Globe className="w-4 h-4 flex-shrink-0" />
      <span className="hidden sm:inline">
        {nextLocale === 'en' ? t('language.en') : t('language.he')}
      </span>
    </button>
  );
}
