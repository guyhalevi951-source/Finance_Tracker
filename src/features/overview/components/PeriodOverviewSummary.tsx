import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../../../config/app';
import { SEMANTIC_COLORS } from '../../../config/semanticColors';
import { type PeriodOverview } from '../../../domain/budget/periodOverview';
import { formatCurrencyAmount } from '../../../lib/format/formatDate';

interface PeriodOverviewSummaryProps {
  overview: PeriodOverview;
  locale: AppLocale;
  hasBudget: boolean;
}

const metricValueClass = 'text-2xl sm:text-3xl font-bold tabular-nums';
const metricLabelClass = 'text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1';

export function PeriodOverviewSummary({ overview, locale, hasBudget }: PeriodOverviewSummaryProps) {
  const { t } = useTranslation();
  const { totalPlanned, averagePerDayUpToDate, leftToSpend, isOverspent } = overview;
  const { expense, budget } = SEMANTIC_COLORS;

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

        <div className="flex-1 min-w-0 text-center">
          <p className={`${metricValueClass} ${expense.valueText}`}>
            {formatCurrencyAmount(averagePerDayUpToDate, locale)}
          </p>
          <p className={metricLabelClass}>{t('overview.dailyAverageUpToDate')}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${expense.badgeBg} ${expense.badgeText}`}
          >
            {t('overview.upToTodayBadge')}
          </span>
        </div>

        <div className="flex-1 min-w-0 text-end">
          <p className={`${metricValueClass} ${rightValueColor}`}>{rightValue}</p>
          <p className={metricLabelClass}>{rightLabel}</p>
        </div>
      </div>
    </div>
  );
}
