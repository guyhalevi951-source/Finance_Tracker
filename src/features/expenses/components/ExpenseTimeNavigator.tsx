import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MonthYearPicker } from '../../../components/calendar';

interface ExpenseTimeNavigatorProps {
  year: number;
  month: number;
  monthLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onSelectMonth: (year: number, month: number) => void;
  variant?: 'default' | 'compact' | 'masterRow';
}

const CHEVRON_BASE_CLASS =
  'flex items-center justify-center border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600';

export function ExpenseTimeNavigator({
  year,
  month,
  monthLabel,
  onPrevious,
  onNext,
  onSelectMonth,
  variant = 'default',
}: ExpenseTimeNavigatorProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  const isCompact = variant === 'compact';
  const isMasterRow = variant === 'masterRow';

  const chevronBtnClass = isMasterRow
    ? `${CHEVRON_BASE_CLASS} min-h-[32px] min-w-[32px] px-1 rounded-lg`
    : isCompact
      ? `${CHEVRON_BASE_CLASS} min-h-[36px] min-w-[36px] rounded-lg`
      : `${CHEVRON_BASE_CLASS} min-h-[44px] min-w-[44px] rounded-xl`;

  const monthBtnClass = isMasterRow
    ? 'flex items-center px-3 min-h-[32px] py-0.5 rounded-lg cursor-pointer text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium text-base leading-tight whitespace-nowrap'
    : isCompact
      ? 'flex items-center gap-1 px-2 min-h-[36px] rounded-lg cursor-pointer text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-semibold whitespace-nowrap'
      : 'flex items-center gap-2 px-3 min-h-[44px] rounded-xl cursor-pointer text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors';

  const monthLabelClass = isMasterRow
    ? 'text-base font-medium leading-tight whitespace-nowrap'
    : 'font-semibold whitespace-nowrap';

  const chevronIconClass = isCompact || isMasterRow ? 'w-4 h-4 rtl:rotate-180' : 'w-5 h-5 rtl:rotate-180';

  const wrapperClass = isMasterRow
    ? 'flex items-center gap-1.5'
    : isCompact
      ? 'flex items-center gap-1'
      : 'flex items-center justify-center gap-2';

  return (
    <>
      <div className={wrapperClass}>
        <button
          type="button"
          onClick={onPrevious}
          aria-label={t('expense.time.prevMonth')}
          className={chevronBtnClass}
        >
          <ChevronLeft className={chevronIconClass} />
        </button>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label={t('calendar.openMonthPicker')}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          className={monthBtnClass}
        >
          {!isCompact && !isMasterRow && (
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
          )}
          <span className={monthLabelClass}>{monthLabel}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label={t('expense.time.nextMonth')}
          className={chevronBtnClass}
        >
          <ChevronRight className={chevronIconClass} />
        </button>
      </div>

      <MonthYearPicker
        open={pickerOpen}
        year={year}
        month={month}
        onSelect={onSelectMonth}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
