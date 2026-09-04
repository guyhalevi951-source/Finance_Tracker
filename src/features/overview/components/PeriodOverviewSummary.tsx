import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../../../config/app';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { type PeriodOverview } from '../../../domain/budget/periodOverview';
import { formatCurrencyAmount, formatCurrencyAmountFixed } from '../../../lib/format/formatDate';

interface PeriodOverviewSummaryProps {
  overview: PeriodOverview;
  locale: AppLocale;
  hasBudget: boolean;
}

const metricValueClass = 'text-2xl sm:text-3xl font-bold tabular-nums';
const metricLabelClass = 'text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1';

export function PeriodOverviewSummary({ overview, locale, hasBudget }: PeriodOverviewSummaryProps) {
  const { t } = useTranslation();
  const [isPlannedAverage, setIsPlannedAverage] = useState(false);
  const { totalPlanned, averagePerDayUpToDate, plannedDailyAverage, leftToSpend, isOverspent } =
    overview;
  const { expense, budget } = SEMANTIC_COLORS;

  const dailyAverageValue = isPlannedAverage ? plannedDailyAverage : averagePerDayUpToDate;
  const dailyAverageLabel = isPlannedAverage
    ? t('overview.dailyAveragePlanned')
    : t('overview.dailyAverage');

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
      <div className="flex justify-between items-end gap-4 px-1">
        <div className="flex-1 min-w-0 text-start">
          <p className={`${metricValueClass} ${expense.valueText}`}>
            {formatCurrencyAmount(totalPlanned, locale)}
          </p>
          <p className={metricLabelClass}>{t('overview.usedAndPlanned')}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsPlannedAverage((prev) => !prev)}
          aria-pressed={isPlannedAverage}
          className="flex-1 min-w-0 text-center cursor-pointer transition-opacity hover:opacity-80 min-h-[44px]"
        >
          <p className={`${metricValueClass} ${expense.valueText}`}>
            {formatCurrencyAmountFixed(dailyAverageValue, locale)}
          </p>
          <p className={metricLabelClass}>{dailyAverageLabel}</p>
        </button>

        <div className="flex-1 min-w-0 text-end">
          <p className={`${metricValueClass} ${rightValueColor}`}>{rightValue}</p>
          <p className={metricLabelClass}>{rightLabel}</p>
        </div>
      </div>
    </div>
  );
}
