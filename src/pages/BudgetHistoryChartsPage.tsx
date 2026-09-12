import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { type AppLocale } from '../config/app';
import { ROUTES } from '../config/routes';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { buildBudgetScopedTitle } from '../domain/budget/buildBudgetScopedTitle';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { BudgetHistoryBackButton } from '../features/budget/components/BudgetHistoryBackButton';
import { useCategories } from '../features/categories/hooks/useCategories';
import { OverviewGraphicViewToggle, type OverviewViewMode } from '../features/overview/components/OverviewGraphicViewToggle';
import { PeriodOverviewDashboard } from '../features/overview/components/PeriodOverviewDashboard';
import { useHistoricalPeriodOverview } from '../features/overview/hooks/useHistoricalPeriodOverview';

export function BudgetHistoryChartsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuthSession();
  const { mainCategories, subCategories } = useCategories(userId);
  const [viewMode, setViewMode] = useState<OverviewViewMode>('daily');

  const {
    budget,
    notFound,
    overview,
    hasBudget,
    todayIso,
    subBudgets,
    breakdownExpenses,
    showDataModeControls,
    loadError,
  } = useHistoricalPeriodOverview(id);

  const pageTitle = budget
    ? buildBudgetScopedTitle(t('nav.charts'), resolveBudgetLabel(budget, locale, t))
    : t('budget.history.title');

  const headerActions = useMemo(
    () =>
      budget ? (
        <OverviewGraphicViewToggle viewMode={viewMode} onSelectView={setViewMode} />
      ) : null,
    [budget, viewMode],
  );

  useAppHeader({ title: pageTitle, actions: headerActions });

  const handleBack = useCallback(() => {
    navigate(ROUTES.budgetHistory);
  }, [navigate]);

  if (notFound || !budget) {
    return (
      <div>
        <BudgetHistoryBackButton onBack={handleBack} label={t('budget.history.back')} />
        <p className="text-center text-slate-500 dark:text-slate-400 py-12">
          {t('budget.history.notFound')}
        </p>
      </div>
    );
  }

  return (
    <div className="relative pb-20">
      <BudgetHistoryBackButton onBack={handleBack} label={t('budget.history.back')} />

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {t('budget.history.readOnly')}
      </p>

      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      <PeriodOverviewDashboard
        overview={overview}
        locale={locale}
        hasBudget={hasBudget}
        isPlannedAverage={false}
        showDataModeControls={showDataModeControls}
        viewMode={viewMode}
        todayIso={todayIso}
        breakdownExpenses={breakdownExpenses}
        mainCategories={mainCategories}
        subCategories={subCategories}
        subBudgets={subBudgets}
        isMaster={false}
        onSelectMode={() => {}}
      />
    </div>
  );
}
