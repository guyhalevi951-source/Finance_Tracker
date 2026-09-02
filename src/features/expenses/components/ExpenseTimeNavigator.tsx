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
}

export function ExpenseTimeNavigator({
  year,
  month,
  monthLabel,
  onPrevious,
  onNext,
  onSelectMonth,
}: ExpenseTimeNavigatorProps) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          aria-label={t('expense.time.prevMonth')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600"
        >
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </button>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label={t('calendar.openMonthPicker')}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          className="flex items-center gap-2 px-3 min-h-[44px] rounded-xl cursor-pointer text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
          <span className="font-semibold whitespace-nowrap">{monthLabel}</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label={t('expense.time.nextMonth')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600"
        >
          <ChevronRight className="w-5 h-5 rtl:rotate-180" />
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
