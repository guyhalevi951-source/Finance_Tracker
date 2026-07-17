import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { type AppHeaderSlotState } from '../../types/appHeader';

const EMPTY_HEADER: AppHeaderSlotState = {
  title: null,
  actions: null,
};

type AppHeaderContextValue = AppHeaderSlotState & {
  setHeader: (state: AppHeaderSlotState) => void;
  resetHeader: () => void;
};

const AppHeaderContext = createContext<AppHeaderContextValue | null>(null);

export function AppHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<AppHeaderSlotState>(EMPTY_HEADER);

  const setHeader = useCallback((state: AppHeaderSlotState) => {
    setHeaderState(state);
  }, []);

  const resetHeader = useCallback(() => {
    setHeaderState(EMPTY_HEADER);
  }, []);

  const value = useMemo(
    () => ({
      title: header.title,
      actions: header.actions,
      setHeader,
      resetHeader,
    }),
    [header.title, header.actions, setHeader, resetHeader],
  );

  return <AppHeaderContext.Provider value={value}>{children}</AppHeaderContext.Provider>;
}

export function useAppHeaderContext(): AppHeaderContextValue {
  const context = useContext(AppHeaderContext);
  if (!context) {
    throw new Error('useAppHeaderContext must be used within AppHeaderProvider');
  }
  return context;
}
