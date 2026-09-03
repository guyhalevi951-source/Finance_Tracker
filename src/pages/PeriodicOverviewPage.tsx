import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { ExpenseFilterToolbar } from '../features/expenses/components/ExpenseFilterToolbar';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { usePeriodOverview } from '../features/overview/hooks/usePeriodOverview';
import { PeriodOverviewSummary } from '../features/overview/components/PeriodOverviewSummary';
import { PeriodExpenseBarChart } from '../features/overview/components/PeriodExpenseBarChart';
import { AddExpenseLauncher } from '../features/expenses/components/AddExpenseLauncher';

export function PeriodicOverviewPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const { expenses, loadError: expensesLoadError } = useExpenses();
  const timeFilter = useExpenseTimeFilter(locale);
  const { overview, hasBudget, loadError: budgetLoadError } = usePeriodOverview(
    expenses,
    timeFilter.range,
    timeFilter.todayIso,
  );

  const loadError = budgetLoadError || expensesLoadError;

  useAppHeader({ title: t('nav.overview') });

  return (
    <div className="relative pb-20">
      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      <ExpenseFilterToolbar
        locale={locale}
        showViewModeToggle={false}
        showGranularityToggle={false}
        {...timeFilter}
      />

      <PeriodOverviewSummary overview={overview} locale={locale} hasBudget={hasBudget} />

      <PeriodExpenseBarChart
        overview={overview}
        locale={locale}
        todayIso={timeFilter.todayIso}
      />

      <AddExpenseLauncher locale={locale} />
    </div>
  );
}
