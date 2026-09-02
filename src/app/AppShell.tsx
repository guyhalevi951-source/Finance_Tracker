import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { AppHeaderProvider } from './providers/AppHeaderProvider';
import { SidebarProvider } from './providers/SidebarProvider';

export function AppShell() {
  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 transition-colors duration-200 flex flex-col">
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <AppHeaderProvider>
            <AppHeader />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8 pb-24 md:pb-8">
              <Outlet />
            </main>
          </AppHeaderProvider>

          <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 mt-auto">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <p className="text-center text-sm text-slate-400 dark:text-slate-500">{t('footer.text')}</p>
            </div>
          </footer>
        </div>

        <AppSidebar />
      </div>
    </SidebarProvider>
  );
}
