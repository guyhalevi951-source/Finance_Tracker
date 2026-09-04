import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { Receipt, Settings, Wallet, X } from 'lucide-react';
import { NAV_ITEMS } from '../../config/nav';
import { AppLogo } from './AppLogo';
import { useSidebarContext } from '../providers/SidebarProvider';
import { HEADER_ICON_BUTTON_CLASS } from './headerIconButton';
import { LanguageToggle } from '../../features/i18n/components/LanguageToggle';
import { ThemeToggle } from '../../features/theme/components/ThemeToggle';
import { UserAvatar } from '../../features/profile/components/UserAvatar';

const SIDEBAR_NAV_ICON_SLOT = 'flex items-center justify-center w-5 h-5 shrink-0';

const NAV_ICONS = {
  budget: Wallet,
  expenses: Receipt,
  profile: null,
  settings: Settings,
} as const;

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
            className={HEADER_ICON_BUTTON_CLASS}
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
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.id];

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={navLinkClass}
                end={item.end}
                onClick={closeSidebar}
                aria-label={item.id === 'profile' ? t('profile.goToProfile') : undefined}
              >
                <span className={SIDEBAR_NAV_ICON_SLOT}>
                  {item.id === 'profile' ? (
                    <UserAvatar variant="nav" />
                  ) : (
                    Icon && <Icon className="w-5 h-5" />
                  )}
                </span>
                <span>{t(`nav.${item.id}`)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div
          className="mt-auto flex items-center justify-end gap-1 p-4 border-t border-slate-200 dark:border-slate-700"
          dir="ltr"
        >
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
