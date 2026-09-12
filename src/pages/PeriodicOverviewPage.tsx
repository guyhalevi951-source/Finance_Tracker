import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { filterExpensesByBudget } from '../domain/budget/filterExpensesByBudget';
import { isSubBudgetOnFinalDay } from '../domain/budget/isSubBudgetOnFinalDay';
import { buildBudgetScopedTitle } from '../domain/budget/buildBudgetScopedTitle';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { resolveSubBudgetWindow } from '../domain/budget/subBudgetExpenseWindow';
import { isFixedSubBudget } from '../domain/budget/subBudgetKind';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useBudgets } from '../features/budget/hooks/useBudgets';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { ExpenseFilterToolbar } from '../features/expenses/components/ExpenseFilterToolbar';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { usePeriodOverview } from '../features/overview/hooks/usePeriodOverview';
import { usePeriodBreakdownExpenses } from '../features/overview/hooks/usePeriodBreakdownExpenses';
import {
  OverviewGraphicViewToggle,
  type OverviewViewMode,
} from '../features/overview/components/OverviewGraphicViewToggle';
import { OverviewTimeframeToggle } from '../features/overview/components/OverviewTimeframeToggle';
import { PeriodOverviewDashboard } from '../features/overview/components/PeriodOverviewDashboard';
import { AddExpenseLauncher } from '../features/expenses/components/AddExpenseLauncher';

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

  const subBudgetWindow = resolveSubBudgetWindow(subBudgets, subBudget?.id);
  // Master and fixed budgets navigate month-by-month; temporary budgets show their whole window.
  const showTimeToolbar = isMaster || (subBudget !== null && isFixedSubBudget(subBudget));

  const scopedExpenses = filterExpensesByBudget(expenses, activeBudgetId, subBudgets);

  const { overview, hasBudget, effectiveRange, loadError: budgetLoadError } = usePeriodOverview(
    scopedExpenses,
    timeFilter.range,
    timeFilter.todayIso,
    { activeBudgetId, subBudget, subBudgets },
  );

  const showDataModeControls = !isSubBudgetOnFinalDay(
    isMaster,
    subBudgetWindow?.endDate ?? null,
    timeFilter.todayIso,
  );

  const breakdownExpenses = usePeriodBreakdownExpenses(
    expenses,
    effectiveRange,
    activeBudgetId,
    timeFilter.todayIso,
    subBudgets,
    isPlannedAverage ? 'planned' : 'actual',
  );

  const loadError = budgetLoadError || expensesLoadError;

  const pageTitle = buildBudgetScopedTitle(
    t('nav.charts'),
    resolveBudgetLabel(activeBudget, locale, t),
  );

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

      {showTimeToolbar && (
        <ExpenseFilterToolbar
          locale={locale}
          showViewModeToggle={false}
          showGranularityToggle={false}
          {...timeFilter}
          extraControls={
            <OverviewTimeframeToggle
              granularity={timeFilter.granularity}
              onSelectTimeframe={timeFilter.setGranularity}
            />
          }
        />
      )}

      <PeriodOverviewDashboard
        overview={overview}
        locale={locale}
        hasBudget={hasBudget}
        isPlannedAverage={isPlannedAverage}
        showDataModeControls={showDataModeControls}
        granularity={timeFilter.granularity}
        timeframeSelectable={showTimeToolbar}
        viewMode={viewMode}
        todayIso={timeFilter.todayIso}
        breakdownExpenses={breakdownExpenses}
        mainCategories={mainCategories}
        subCategories={subCategories}
        subBudgets={subBudgets}
        isMaster={isMaster}
        onSelectMode={setIsPlannedAverage}
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
