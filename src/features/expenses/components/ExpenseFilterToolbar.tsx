import { type AppLocale } from '../../../config/app';
import { type UseExpenseTimeFilterReturn } from '../hooks/useExpenseTimeFilter';
import { ExpenseTimeFilterBar } from './ExpenseTimeFilterBar';
import { ExpensesViewTabs, type ExpensesViewMode } from './ExpensesViewTabs';

interface ExpenseFilterToolbarProps extends UseExpenseTimeFilterReturn {
  locale: AppLocale;
  showViewModeToggle?: boolean;
  showGranularityToggle?: boolean;
  viewMode?: ExpensesViewMode;
  onViewModeChange?: (mode: ExpensesViewMode) => void;
}

export function ExpenseFilterToolbar({
  locale,
  showViewModeToggle = true,
  showGranularityToggle = true,
  viewMode = 'date',
  onViewModeChange,
  ...timeFilter
}: ExpenseFilterToolbarProps) {
  return (
    <>
      {showViewModeToggle && onViewModeChange && (
        <ExpensesViewTabs active={viewMode} onChange={onViewModeChange} />
      )}
      <ExpenseTimeFilterBar
        locale={locale}
        showGranularityToggle={showGranularityToggle}
        {...timeFilter}
      />
    </>
  );
}
