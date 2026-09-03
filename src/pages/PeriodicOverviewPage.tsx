import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { buildBudgetScopedTitle } from '../domain/budget/buildBudgetScopedTitle';
import { filterExpensesByBudget } from '../domain/budget/filterExpensesByBudget';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { useBudgets } from '../features/budget/hooks/useBudgets';
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
  const { activeBudgetId, activeBudget, isMaster, subBudgets } = useBudgets();
  const timeFilter = useExpenseTimeFilter(locale);

  const subBudget =
    !isMaster && 'name' in activeBudget ? activeBudget : null;

  const subBudgetWindow = subBudget
    ? { startDate: subBudget.startDate, endDate: subBudget.endDate }
    : null;

  const scopedExpenses = filterExpensesByBudget(expenses, activeBudgetId);

  const { overview, hasBudget, effectiveRange, loadError: budgetLoadError } = usePeriodOverview(
    scopedExpenses,
    timeFilter.range,
    timeFilter.todayIso,
    { activeBudgetId, subBudget, subBudgets },
  );

  const loadError = budgetLoadError || expensesLoadError;

  const pageTitle = buildBudgetScopedTitle(
    resolveBudgetLabel(activeBudget, locale, t),
    t('nav.overview'),
    isMaster,
  );

  useAppHeader({ title: pageTitle });

  return (
    <div className="relative pb-20">
      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      {isMaster && (
        <ExpenseFilterToolbar
          locale={locale}
          showViewModeToggle={false}
          showGranularityToggle={false}
          {...timeFilter}
        />
      )}

      <PeriodOverviewSummary overview={overview} locale={locale} hasBudget={hasBudget} />

      <PeriodExpenseBarChart
        overview={overview}
        locale={locale}
        todayIso={timeFilter.todayIso}
      />

      <AddExpenseLauncher
        locale={locale}
        activeBudgetId={activeBudgetId}
        isMaster={isMaster}
        subBudgetWindow={subBudgetWindow}
      />
    </div>
  );
}
