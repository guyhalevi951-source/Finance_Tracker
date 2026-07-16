import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../../../config/app';
import { type MonthWeekRange } from '../../../domain/expenses/periods';
import { formatWeekRangeLabel } from '../../../lib/format/formatDate';

interface ExpenseWeekSelectorProps {
  weeks: MonthWeekRange[];
  selectedWeekIndex: number | null;
  locale: AppLocale;
  onSelectWeek: (index: number) => void;
}

export function ExpenseWeekSelector({
  weeks,
  selectedWeekIndex,
  locale,
  onSelectWeek,
}: ExpenseWeekSelectorProps) {
  const { t } = useTranslation();
  const activeIndex = selectedWeekIndex ?? 0;

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-2 flex-nowrap min-w-min pb-1">
        {weeks.map((week) => {
          const label = formatWeekRangeLabel(week.startIso, week.endIso, locale);
          const isActive = week.index === activeIndex;

          return (
            <button
              key={week.startIso}
              type="button"
              aria-pressed={isActive}
              aria-label={t('expense.time.weekRange', {
                start: formatWeekRangeLabel(week.startIso, week.startIso, locale),
                end: formatWeekRangeLabel(week.endIso, week.endIso, locale),
              })}
              onClick={() => onSelectWeek(week.index)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
