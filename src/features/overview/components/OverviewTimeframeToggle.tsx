import { useTranslation } from 'react-i18next';
import { Calendar, CalendarRange } from 'lucide-react';
import { type TimeGranularity } from '../../../domain/expenses/periods';
import { OVERVIEW_TOGGLE_BUTTON_CLASS, OVERVIEW_TOGGLE_FRAME_CLASS } from './overviewToggleButton';

export type OverviewTimeframe = 'monthly' | 'weekly';

interface OverviewTimeframeToggleProps {
  granularity: TimeGranularity;
  onSelectTimeframe: (timeframe: OverviewTimeframe) => void;
}

export function OverviewTimeframeToggle({
  granularity,
  onSelectTimeframe,
}: OverviewTimeframeToggleProps) {
  const { t } = useTranslation();
  const isWeekly = granularity === 'weekly';

  return (
    <div role="group" className={OVERVIEW_TOGGLE_FRAME_CLASS}>
      <button
        type="button"
        aria-pressed={!isWeekly}
        onClick={() => onSelectTimeframe('monthly')}
        className={`${OVERVIEW_TOGGLE_BUTTON_CLASS} flex-1 whitespace-nowrap ${
          !isWeekly ? 'bg-slate-100 dark:bg-slate-700' : ''
        }`}
      >
        {t('overview.monthlyView')}
        <Calendar className="mt-0.5 h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={isWeekly}
        onClick={() => onSelectTimeframe('weekly')}
        className={`${OVERVIEW_TOGGLE_BUTTON_CLASS} flex-1 whitespace-nowrap ${
          isWeekly ? 'bg-slate-100 dark:bg-slate-700' : ''
        }`}
      >
        {t('overview.weeklyView')}
        <CalendarRange className="mt-0.5 h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
