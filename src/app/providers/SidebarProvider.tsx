import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSidebarOpen } from '../hooks/useSidebarOpen';

interface SidebarContextValue {
  isOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const { isOpen, openSidebar, closeSidebar } = useSidebarOpen();

  const value = useMemo(
    () => ({ isOpen, openSidebar, closeSidebar }),
    [isOpen, openSidebar, closeSidebar],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebarContext(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
}
