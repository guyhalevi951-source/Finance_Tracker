import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../../../config/app';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { type PeriodOverview } from '../../../domain/budget/periodOverview';
import { shouldShowOverviewBudgetRemainder } from '../../../domain/budget/shouldShowOverviewBudgetRemainder';
import {
  resolveFutureDailyAverageHintKind,
  type FutureDailyAverageHintKind,
} from '../../../domain/budget/resolveFutureDailyAverageHintKind';
import { type TimeGranularity } from '../../../domain/expenses/periods';
import { formatCurrencyAmount, formatCurrencyAmountFixed } from '../../../lib/format/formatDate';

interface PeriodOverviewSummaryProps {
  overview: PeriodOverview;
  locale: AppLocale;
  hasBudget: boolean;
  isPlannedAverage: boolean;
  showDataModeControls: boolean;
  granularity?: TimeGranularity;
  timeframeSelectable?: boolean;
}

const FUTURE_DAILY_AVERAGE_HINT_KEYS: Record<FutureDailyAverageHintKind, string> = {
  monthly: 'overview.dailyAverageMonthlyHint',
  weekly: 'overview.dailyAverageWeeklyHint',
  includingFuture: 'overview.includingFutureExpenses',
};

const metricValueClass = 'text-2xl sm:text-3xl font-bold tabular-nums';
const metricLabelClass = 'text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1';
const metricHintClass = 'text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5';

export function PeriodOverviewSummary({
  overview,
  locale,
  hasBudget,
  isPlannedAverage,
  showDataModeControls,
  granularity = 'monthly',
  timeframeSelectable = false,
}: PeriodOverviewSummaryProps) {
  const { t } = useTranslation();
  const {
    spent,
    totalPlanned,
    averagePerDayUpToDate,
    plannedDailyAverage,
    leftToSpend,
    isOverspent,
  } = overview;
  const { expense, budget } = SEMANTIC_COLORS;
  const showRemainder = shouldShowOverviewBudgetRemainder(granularity);

  const dailyAverageValue = isPlannedAverage ? plannedDailyAverage : averagePerDayUpToDate;
  const dailyAverageHint = isPlannedAverage
    ? t(FUTURE_DAILY_AVERAGE_HINT_KEYS[resolveFutureDailyAverageHintKind(granularity, timeframeSelectable)])
    : t('overview.upToTodayBadge');

  const displayTotal = isPlannedAverage ? totalPlanned : spent;
  const totalLabel = isPlannedAverage ? t('overview.usedAndPlanned') : t('overview.used');

  const rightValue = hasBudget
    ? formatCurrencyAmount(Math.abs(leftToSpend), locale)
    : '—';
  const rightLabel = hasBudget
    ? isOverspent
      ? t('overview.overspent')
      : t('overview.leftToSpend')
    : t('overview.noBudget');

  const rightValueColor = !hasBudget
    ? 'text-slate-400 dark:text-slate-500'
    : isOverspent
      ? expense.valueText
      : budget.valueText;

  return (
    <div className="mb-6">
      <div
        className={`grid items-end gap-2 px-4 sm:px-6 ${
          showRemainder ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        <div className={`min-w-0 ${showRemainder ? 'text-start' : 'text-center'}`}>
          <p className={`${metricValueClass} ${expense.valueText}`}>
            {formatCurrencyAmount(displayTotal, locale)}
          </p>
          <p className={metricLabelClass}>{totalLabel}</p>
        </div>

        <div className="min-w-0 text-center">
          <p className={`${metricValueClass} ${expense.valueText}`}>
            {formatCurrencyAmountFixed(dailyAverageValue, locale)}
          </p>
          <p className={metricLabelClass}>{t('overview.dailyAverage')}</p>
          {showDataModeControls && (
            <p className={metricHintClass}>({dailyAverageHint})</p>
          )}
        </div>

        {showRemainder && (
          <div className="min-w-0 text-end">
            <p className={`${metricValueClass} ${rightValueColor}`}>{rightValue}</p>
            <p className={metricLabelClass}>{rightLabel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
