import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Wallet } from 'lucide-react';
import { type AppLocale } from '../../config/app';
import { getMonthBounds } from '../domain/expenses/periods';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useBudgetTracker } from '../features/budget/hooks/useBudgetTracker';
import { BudgetSettingsCard } from '../features/budget/components/BudgetSettingsCard';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { filterExpensesByPeriod } from '../domain/expenses/periods';
import { formatCurrencyAmount } from '../lib/format/formatDate';
import { useTodayIso } from '../lib/hooks/useTodayIso';

export function BudgetSettingsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const todayIso = useTodayIso();
  const { expenses, loadError: expensesLoadError } = useExpenses();

  const currentMonthRange = useMemo(() => {
    const today = new Date(`${todayIso}T00:00:00`);
    return getMonthBounds(today.getFullYear(), today.getMonth());
  }, [todayIso]);

  const currentMonthExpenses = useMemo(
    () => filterExpensesByPeriod(expenses, currentMonthRange),
    [expenses, currentMonthRange],
  );

  const {
    budget,
    budgetInput,
    summary,
    showBudgetSaved,
    loadError: budgetLoadError,
    setBudgetInput,
    handleSetBudget,
  } = useBudgetTracker(currentMonthExpenses);

  const { totalExpenses, budgetPercentage, isOverBudget, remaining } = summary;
  const loadError = budgetLoadError || expensesLoadError;

  useAppHeader({ title: t('budget.pageTitle') });

  return (
    <div>
      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      <BudgetSettingsCard
        budget={budget}
        budgetInput={budgetInput}
        showBudgetSaved={showBudgetSaved}
        locale={locale}
        setBudgetInput={setBudgetInput}
        handleSetBudget={handleSetBudget}
      />

      <div
        className={`rounded-2xl shadow-sm border p-6 transition-all duration-200 ${
          isOverBudget
            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {t('budget.monthlyUsageTitle')}
          </h2>
          <div className={`p-2 rounded-lg ${isOverBudget ? 'bg-rose-200' : 'bg-blue-100'}`}>
            {isOverBudget ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <Wallet className="w-5 h-5 text-blue-600" />
            )}
          </div>
        </div>

        {isOverBudget && (
          <div className="bg-rose-600 text-white text-xs font-medium px-2 py-1 rounded-full inline-block mb-3">
            {t('budget.card.overBudgetBadge')}
          </div>
        )}

        <div className="flex justify-between items-baseline gap-4 mb-4 flex-wrap">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('budget.card.totalExpenses')}</p>
            <p
              className={`text-2xl font-bold tabular-nums ${
                isOverBudget ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {formatCurrencyAmount(totalExpenses, locale)}
            </p>
          </div>
          <div className="text-end">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('budget.card.monthlyBudget')}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
              {formatCurrencyAmount(budget, locale)}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
          {remaining >= 0 ? t('budget.card.remaining') : t('budget.card.overBudget')}:{' '}
          <span className={`font-semibold ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
            {remaining >= 0
              ? formatCurrencyAmount(remaining, locale)
              : `-${formatCurrencyAmount(Math.abs(remaining), locale)}`}
          </span>
        </p>

        <div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{t('budget.card.usage')}</span>
            <span>{Math.min(100, budgetPercentage).toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                  : budgetPercentage > 80
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            {t('budget.card.expensesThisMonth', { count: currentMonthExpenses.length })}
          </p>
        </div>
      </div>
    </div>
  );
}
