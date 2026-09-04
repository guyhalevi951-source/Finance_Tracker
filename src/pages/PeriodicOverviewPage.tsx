import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { filterExpensesByBudget } from '../domain/budget/filterExpensesByBudget';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useBudgets } from '../features/budget/hooks/useBudgets';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { ExpenseFilterToolbar } from '../features/expenses/components/ExpenseFilterToolbar';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { usePeriodVisibleExpenses } from '../features/expenses/hooks/usePeriodVisibleExpenses';
import { usePeriodOverview } from '../features/overview/hooks/usePeriodOverview';
import { PeriodOverviewSummary } from '../features/overview/components/PeriodOverviewSummary';
import { PeriodExpenseBarChart } from '../features/overview/components/PeriodExpenseBarChart';
import { PeriodCategoryBreakdownChart } from '../features/overview/components/PeriodCategoryBreakdownChart';
import { OverviewGraphicViewToggle } from '../features/overview/components/OverviewGraphicViewToggle';
import { AddExpenseLauncher } from '../features/expenses/components/AddExpenseLauncher';

export type OverviewViewMode = 'daily' | 'category';

export function PeriodicOverviewPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const { userId } = useAuthSession();
  const { mainCategories, subCategories } = useCategories(userId);
  const { expenses, loadError: expensesLoadError } = useExpenses();
  const { activeBudgetId, activeBudget, isMaster, subBudgets } = useBudgets();
  const timeFilter = useExpenseTimeFilter(locale);
  const [viewMode, setViewMode] = useState<OverviewViewMode>('daily');

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

  const periodVisibleExpenses = usePeriodVisibleExpenses(
    expenses,
    effectiveRange,
    activeBudgetId,
    timeFilter.todayIso,
  );

  const loadError = budgetLoadError || expensesLoadError;

  const budgetLabel = resolveBudgetLabel(activeBudget, locale, t);
  const pageTitle = isMaster
    ? t('overview.monthlyTitle')
    : `${t('nav.overview')} - ${budgetLabel}`;

  const headerActions = useMemo(
    () => (
      <OverviewGraphicViewToggle
        isCategoryView={viewMode === 'category'}
        onToggle={() => setViewMode((prev) => (prev === 'daily' ? 'category' : 'daily'))}
      />
    ),
    [viewMode],
  );

  useAppHeader({ title: pageTitle, actions: headerActions });

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

      {viewMode === 'daily' ? (
        <PeriodExpenseBarChart
          overview={overview}
          locale={locale}
          todayIso={timeFilter.todayIso}
        />
      ) : (
        <PeriodCategoryBreakdownChart
          expenses={periodVisibleExpenses}
          locale={locale}
          mainCategories={mainCategories}
          subCategories={subCategories}
          subBudgets={subBudgets}
          isMaster={isMaster}
        />
      )}

      <AddExpenseLauncher
        locale={locale}
        activeBudgetId={activeBudgetId}
        isMaster={isMaster}
        subBudgetWindow={subBudgetWindow}
      />
    </div>
  );
}
