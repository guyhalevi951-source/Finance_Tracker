import { useTranslation } from 'react-i18next';
import { BarChart3, PieChart } from 'lucide-react';
import { OVERVIEW_TOGGLE_BUTTON_CLASS, OVERVIEW_TOGGLE_FRAME_CLASS } from './overviewToggleButton';

export type OverviewViewMode = 'daily' | 'category';

interface OverviewGraphicViewToggleProps {
  viewMode: OverviewViewMode;
  onSelectView: (mode: OverviewViewMode) => void;
}

export function OverviewGraphicViewToggle({
  viewMode,
  onSelectView,
}: OverviewGraphicViewToggleProps) {
  const { t } = useTranslation();

  return (
    <div role="group" className={OVERVIEW_TOGGLE_FRAME_CLASS}>
      <button
        type="button"
        aria-pressed={viewMode === 'category'}
        onClick={() => onSelectView('category')}
        className={`${OVERVIEW_TOGGLE_BUTTON_CLASS} whitespace-nowrap ${
          viewMode === 'category' ? 'bg-slate-100 dark:bg-slate-700' : ''
        }`}
      >
        {t('overview.graphicView')}
        <PieChart className="mt-0.5 h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={viewMode === 'daily'}
        onClick={() => onSelectView('daily')}
        className={`${OVERVIEW_TOGGLE_BUTTON_CLASS} whitespace-nowrap ${
          viewMode === 'daily' ? 'bg-slate-100 dark:bg-slate-700' : ''
        }`}
      >
        {t('overview.dailyView')}
        <BarChart3 className="mt-0.5 h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
