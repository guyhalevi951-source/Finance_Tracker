import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { filterExpensesByBudget } from '../domain/budget/filterExpensesByBudget';
import { isSubBudgetOnFinalDay } from '../domain/budget/isSubBudgetOnFinalDay';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useBudgets } from '../features/budget/hooks/useBudgets';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { ExpenseFilterToolbar } from '../features/expenses/components/ExpenseFilterToolbar';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { usePeriodOverview } from '../features/overview/hooks/usePeriodOverview';
import { usePeriodBreakdownExpenses } from '../features/overview/hooks/usePeriodBreakdownExpenses';
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
  const [isPlannedAverage, setIsPlannedAverage] = useState(false);

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

  const hideDataModeControls = isSubBudgetOnFinalDay(
    isMaster,
    subBudget?.endDate ?? null,
    timeFilter.todayIso,
  );
  const showDataModeControls = !hideDataModeControls;

  const breakdownExpenses = usePeriodBreakdownExpenses(
    expenses,
    effectiveRange,
    activeBudgetId,
    timeFilter.todayIso,
    subBudgets,
    isPlannedAverage ? 'planned' : 'actual',
  );

  const loadError = budgetLoadError || expensesLoadError;

  const budgetLabel = resolveBudgetLabel(activeBudget, locale, t);
  const pageTitle = isMaster
    ? t('overview.monthlyTitle')
    : `${t('nav.charts')} - ${budgetLabel}`;

  const headerActions = useMemo(
    () => (
      <OverviewGraphicViewToggle
        viewMode={viewMode}
        onSelectView={setViewMode}
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

      <PeriodOverviewSummary
        overview={overview}
        locale={locale}
        hasBudget={hasBudget}
        isPlannedAverage={isPlannedAverage}
        showDataModeControls={showDataModeControls}
      />

      {viewMode === 'daily' ? (
        <PeriodExpenseBarChart
          overview={overview}
          locale={locale}
          todayIso={timeFilter.todayIso}
          isPlannedAverage={isPlannedAverage}
          onSelectMode={setIsPlannedAverage}
          showDataModeControls={showDataModeControls}
        />
      ) : (
        <PeriodCategoryBreakdownChart
          expenses={breakdownExpenses}
          locale={locale}
          mainCategories={mainCategories}
          subCategories={subCategories}
          subBudgets={subBudgets}
          isMaster={isMaster}
          isPlannedAverage={isPlannedAverage}
          onSelectMode={setIsPlannedAverage}
          showDataModeControls={showDataModeControls}
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
