import { useTranslation } from 'react-i18next';
import { Calendar, TrendingUp } from 'lucide-react';
import { OVERVIEW_TOGGLE_BUTTON_CLASS, OVERVIEW_TOGGLE_FRAME_CLASS } from './overviewToggleButton';

interface OverviewDataModeToggleProps {
  isPlannedAverage: boolean;
  onSelectMode: (isPlannedAverage: boolean) => void;
}

export function OverviewDataModeToggle({
  isPlannedAverage,
  onSelectMode,
}: OverviewDataModeToggleProps) {
  const { t } = useTranslation();

  return (
    <div role="group" className={OVERVIEW_TOGGLE_FRAME_CLASS}>
      <button
        type="button"
        aria-pressed={!isPlannedAverage}
        onClick={() => onSelectMode(false)}
        className={`${OVERVIEW_TOGGLE_BUTTON_CLASS} whitespace-nowrap ${
          !isPlannedAverage ? 'bg-slate-100 dark:bg-slate-700' : ''
        }`}
      >
        {t('overview.upToTodayBadge')}
        <Calendar className="mt-0.5 h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={isPlannedAverage}
        onClick={() => onSelectMode(true)}
        className={`${OVERVIEW_TOGGLE_BUTTON_CLASS} text-center ${
          isPlannedAverage ? 'bg-slate-100 dark:bg-slate-700' : ''
        }`}
      >
        {t('overview.includingFutureExpenses')}
        <TrendingUp className="mt-0.5 h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
