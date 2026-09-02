import { type AppLocale } from '../../../config/app';
import { type UseExpenseTimeFilterReturn } from '../hooks/useExpenseTimeFilter';
import { ExpenseDaySelector } from './ExpenseDaySelector';
import { ExpenseGranularityToggle } from './ExpenseGranularityToggle';
import { ExpenseTimeNavigator } from './ExpenseTimeNavigator';
import { ExpenseWeekSelector } from './ExpenseWeekSelector';

interface ExpenseTimeFilterBarProps extends UseExpenseTimeFilterReturn {
  locale: AppLocale;
  showGranularityToggle?: boolean;
}

export function ExpenseTimeFilterBar({
  locale,
  year,
  month,
  monthLabel,
  granularity,
  weeks,
  days,
  selectedWeekIndex,
  selectedDayIso,
  todayIso,
  goToPreviousMonth,
  goToNextMonth,
  selectMonth,
  setGranularity,
  selectWeek,
  selectDay,
  showGranularityToggle = true,
}: ExpenseTimeFilterBarProps) {
  return (
    <div className="space-y-4 mb-6">
      <ExpenseTimeNavigator
        year={year}
        month={month}
        monthLabel={monthLabel}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onSelectMonth={selectMonth}
      />
      {showGranularityToggle && (
        <>
          <ExpenseGranularityToggle active={granularity} onChange={setGranularity} />
          {granularity === 'weekly' && (
            <ExpenseWeekSelector
              weeks={weeks}
              selectedWeekIndex={selectedWeekIndex}
              locale={locale}
              onSelectWeek={selectWeek}
            />
          )}
          {granularity === 'daily' && (
            <ExpenseDaySelector
              days={days}
              selectedDayIso={selectedDayIso}
              todayIso={todayIso}
              onSelectDay={selectDay}
            />
          )}
        </>
      )}
    </div>
  );
}
