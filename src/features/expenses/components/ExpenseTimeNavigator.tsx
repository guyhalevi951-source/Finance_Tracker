import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ExpenseTimeNavigatorProps {
  monthLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function ExpenseTimeNavigator({ monthLabel, onPrevious, onNext }: ExpenseTimeNavigatorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={onPrevious}
        aria-label={t('expense.time.prevMonth')}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600"
      >
        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
      </button>

      <div className="flex items-center gap-2 px-3 min-h-[44px]">
        <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
        <span className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
          {monthLabel}
        </span>
      </div>

      <button
        type="button"
        onClick={onNext}
        aria-label={t('expense.time.nextMonth')}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600"
      >
        <ChevronRight className="w-5 h-5 rtl:rotate-180" />
      </button>
    </div>
  );
}
