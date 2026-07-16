import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet } from 'lucide-react';
import { ROUTES } from '../config/routes';
import { LanguageToggle } from '../features/i18n/components/LanguageToggle';
import { ThemeToggle } from '../features/theme/components/ThemeToggle';
import { formatDate } from '../lib/format/formatDate';
import { type AppLocale } from '../config/app';

export function AppShell() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] min-w-[44px] ${
      isActive
        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 transition-colors duration-200 flex flex-col md:flex-row">
      <aside className="md:w-56 md:min-h-screen bg-white dark:bg-slate-800 border-b md:border-b-0 md:border-e border-slate-200 dark:border-slate-700 flex md:flex-col">
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{t('app.name')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('app.tagline')}</p>
          </div>
        </div>

        <nav className="flex md:flex-col flex-1 justify-around md:justify-start md:gap-1 p-2 md:p-4">
          <NavLink to={ROUTES.dashboard} className={navLinkClass} end>
            <LayoutDashboard className="w-5 h-5" />
            <span>{t('nav.dashboard')}</span>
          </NavLink>
          <NavLink to={ROUTES.expenses} className={navLinkClass}>
            <Receipt className="w-5 h-5" />
            <span>{t('nav.expenses')}</span>
          </NavLink>
        </nav>

        <div className="hidden md:flex items-center gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100">{t('app.name')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 pb-24 md:pb-8">
          <p className="hidden md:block text-sm text-slate-400 dark:text-slate-500 mb-6">
            {formatDate(new Date(), locale)}
          </p>
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <p className="text-center text-sm text-slate-400 dark:text-slate-500">{t('footer.text')}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
