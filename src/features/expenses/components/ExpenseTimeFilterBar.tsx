import { type AppLocale } from '../../../config/app';
import { type UseExpenseTimeFilterReturn } from '../hooks/useExpenseTimeFilter';
import { ExpenseDaySelector } from './ExpenseDaySelector';
import { ExpenseGranularityToggle } from './ExpenseGranularityToggle';
import { ExpenseTimeNavigator } from './ExpenseTimeNavigator';
import { ExpenseWeekSelector } from './ExpenseWeekSelector';

interface ExpenseTimeFilterBarProps extends UseExpenseTimeFilterReturn {
  locale: AppLocale;
}

export function ExpenseTimeFilterBar({
  locale,
  monthLabel,
  granularity,
  weeks,
  days,
  selectedWeekIndex,
  selectedDayIso,
  todayIso,
  goToPreviousMonth,
  goToNextMonth,
  setGranularity,
  selectWeek,
  selectDay,
}: ExpenseTimeFilterBarProps) {
  return (
    <div className="space-y-4 mb-6">
      <ExpenseTimeNavigator
        monthLabel={monthLabel}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
      />
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
    </div>
  );
}
