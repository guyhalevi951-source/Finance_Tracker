import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDayOfMonth } from '../../../lib/format/formatDate';

interface ExpenseDaySelectorProps {
  days: string[];
  selectedDayIso: string | null;
  todayIso: string;
  onSelectDay: (iso: string) => void;
}

export function ExpenseDaySelector({
  days,
  selectedDayIso,
  todayIso,
  onSelectDay,
}: ExpenseDaySelectorProps) {
  const { t } = useTranslation();
  const activeIso = selectedDayIso ?? days[0] ?? null;
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIso]);

  if (days.length === 0) return null;

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-2 flex-nowrap min-w-min pb-1">
        {days.map((iso) => {
          const dayNum = formatDayOfMonth(iso);
          const isActive = iso === activeIso;
          const isToday = iso === todayIso;

          return (
            <button
              key={iso}
              ref={isActive ? selectedRef : undefined}
              type="button"
              aria-pressed={isActive}
              aria-label={t('expense.time.selectDay', { day: dayNum })}
              aria-current={isToday ? 'date' : undefined}
              onClick={() => onSelectDay(iso)}
              className={`shrink-0 min-w-[44px] min-h-[44px] px-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
