import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../../../config/app';
import { type PeriodOverview } from '../../../domain/budget/periodOverview';
import { formatCurrencyAmount } from '../../../lib/format/formatDate';

interface PeriodOverviewSummaryProps {
  overview: PeriodOverview;
  locale: AppLocale;
  hasBudget: boolean;
}

export function PeriodOverviewSummary({ overview, locale, hasBudget }: PeriodOverviewSummaryProps) {
  const { t } = useTranslation();
  const { spent, leftToSpend, isOverspent } = overview;

  const rightValue = hasBudget
    ? formatCurrencyAmount(Math.abs(leftToSpend), locale)
    : '—';
  const rightLabel = hasBudget
    ? isOverspent
      ? t('overview.overspent')
      : t('overview.leftToSpend')
    : t('overview.noBudget');

  const rightColor = !hasBudget
    ? 'text-slate-400 dark:text-slate-500'
    : isOverspent
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end gap-4 px-1">
        <div className="flex-1 min-w-0">
          <p className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrencyAmount(spent, locale)}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('overview.usedAndPlanned')}
          </p>
        </div>

        <div className="flex-1 min-w-0 text-end">
          <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${rightColor}`}>
            {rightValue}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {rightLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
