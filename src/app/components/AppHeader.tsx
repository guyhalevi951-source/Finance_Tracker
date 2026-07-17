import { LanguageToggle } from '../../features/i18n/components/LanguageToggle';
import { ProfileHeaderButton } from '../../features/profile/components/ProfileHeaderButton';
import { ThemeToggle } from '../../features/theme/components/ThemeToggle';
import { useAppHeaderContext } from '../providers/AppHeaderProvider';

export function AppHeader() {
  const { title, actions } = useAppHeaderContext();

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2 min-h-[52px]">
        <div className="flex items-center gap-2 shrink-0 z-10">
          <ProfileHeaderButton />
          <LanguageToggle />
          <ThemeToggle />
        </div>

        {title && (
          <h1 className="absolute inset-x-0 z-20 text-center text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 truncate px-20 pointer-events-none">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-2 shrink-0 z-10 min-w-[44px] justify-end">
          {actions}
        </div>
      </div>
    </header>
  );
}
