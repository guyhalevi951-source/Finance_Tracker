import { useCallback, useState } from 'react';

export function useSidebarOpen() {
  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { isOpen, openSidebar, closeSidebar };
}
