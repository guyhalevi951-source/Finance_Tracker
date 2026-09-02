import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { useSidebarContext } from '../providers/SidebarProvider';
import { HEADER_ICON_BUTTON_CLASS } from './headerIconButton';
export function SidebarToggle() {
  const { t } = useTranslation();
  const { isOpen, openSidebar } = useSidebarContext();

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={openSidebar}
      aria-label={t('nav.openMenu')}
      aria-expanded={false}
      className={HEADER_ICON_BUTTON_CLASS}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
