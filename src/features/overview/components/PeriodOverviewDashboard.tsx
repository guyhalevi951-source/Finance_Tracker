import { type AppLocale } from '../../../config/app';
import { type PeriodOverview } from '../../../domain/budget/periodOverview';
import { type TimeGranularity } from '../../../domain/expenses/periods';
import { type SubBudgetRecord } from '../../../types/budget';
import { type MainCategoryRecord, type SubCategoryRecord } from '../../../types/category';
import { type Expense } from '../../../types/expense';
import { PeriodOverviewSummary } from './PeriodOverviewSummary';
import { PeriodExpenseBarChart } from './PeriodExpenseBarChart';
import { PeriodCategoryBreakdownChart } from './PeriodCategoryBreakdownChart';
import { type OverviewViewMode } from './OverviewGraphicViewToggle';

interface PeriodOverviewDashboardProps {
  overview: PeriodOverview;
  locale: AppLocale;
  hasBudget: boolean;
  isPlannedAverage: boolean;
  showDataModeControls: boolean;
  viewMode: OverviewViewMode;
  granularity?: TimeGranularity;
  timeframeSelectable?: boolean;
  todayIso: string;
  breakdownExpenses: Expense[];
  mainCategories: MainCategoryRecord[];
  subCategories: SubCategoryRecord[];
  subBudgets: SubBudgetRecord[];
  isMaster: boolean;
  onSelectMode: (isPlannedAverage: boolean) => void;
}

export function PeriodOverviewDashboard({
  overview,
  locale,
  hasBudget,
  isPlannedAverage,
  showDataModeControls,
  viewMode,
  granularity,
  timeframeSelectable,
  todayIso,
  breakdownExpenses,
  mainCategories,
  subCategories,
  subBudgets,
  isMaster,
  onSelectMode,
}: PeriodOverviewDashboardProps) {
  return (
    <>
      <PeriodOverviewSummary
        overview={overview}
        locale={locale}
        hasBudget={hasBudget}
        isPlannedAverage={isPlannedAverage}
        showDataModeControls={showDataModeControls}
        granularity={granularity}
        timeframeSelectable={timeframeSelectable}
      />

      {viewMode === 'daily' ? (
        <PeriodExpenseBarChart
          overview={overview}
          locale={locale}
          todayIso={todayIso}
          isPlannedAverage={isPlannedAverage}
          onSelectMode={onSelectMode}
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
          onSelectMode={onSelectMode}
          showDataModeControls={showDataModeControls}
        />
      )}
    </>
  );
}
