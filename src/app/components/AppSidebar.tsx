import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet, X } from 'lucide-react';
import { ROUTES } from '../../config/routes';
import { AppLogo } from './AppLogo';
import { useSidebarContext } from '../providers/SidebarProvider';

export function AppSidebar() {
  const { t } = useTranslation();
  const { isOpen, closeSidebar } = useSidebarContext();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeSidebar]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-row items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
      isActive
        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          aria-hidden="true"
          onClick={closeSidebar}
        />
      )}

      <aside
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 left-auto z-50 w-56 bg-white dark:bg-slate-800 border-s border-slate-200 dark:border-slate-700 flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-end p-2 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={closeSidebar}
            aria-label={t('nav.closeMenu')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 p-6 border-b border-slate-200 dark:border-slate-700">
          <AppLogo className="w-32 h-32" />
          <div className="text-center">
            <p className="font-bold text-slate-800 dark:text-slate-100">{t('app.name')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('app.tagline')}</p>
          </div>
        </div>

        <nav className="flex flex-col flex-1 gap-1 p-4">
          <NavLink to={ROUTES.overview} className={navLinkClass} end onClick={closeSidebar}>
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>{t('nav.overview')}</span>
          </NavLink>
          <NavLink to={ROUTES.budget} className={navLinkClass} onClick={closeSidebar}>
            <Wallet className="w-5 h-5 shrink-0" />
            <span>{t('nav.budget')}</span>
          </NavLink>
          <NavLink to={ROUTES.expenses} className={navLinkClass} onClick={closeSidebar}>
            <Receipt className="w-5 h-5 shrink-0" />
            <span>{t('nav.expenses')}</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
