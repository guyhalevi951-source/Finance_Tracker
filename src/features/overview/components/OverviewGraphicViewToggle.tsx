import { useTranslation } from 'react-i18next';

interface OverviewGraphicViewToggleProps {
  isCategoryView: boolean;
  onToggle: () => void;
}

export function OverviewGraphicViewToggle({
  isCategoryView,
  onToggle,
}: OverviewGraphicViewToggleProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isCategoryView}
      className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium min-h-[44px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
    >
      {isCategoryView ? t('overview.dailyView') : t('overview.graphicView')}
    </button>
  );
}
