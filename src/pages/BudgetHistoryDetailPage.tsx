import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { type AppLocale } from '../config/app';
import { ROUTES } from '../config/routes';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { computeOverviewForPeriodBudget } from '../domain/budget/periodOverview';
import { filterExpensesByBudget } from '../domain/budget/filterExpensesByBudget';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { useBudgets } from '../features/budget/hooks/useBudgets';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { useTodayIso } from '../lib/hooks/useTodayIso';
import { SEMANTIC_COLORS } from '../config/semanticColors';
import { formatCurrencyAmount, formatExpenseDateNumeric } from '../lib/format/formatDate';

export function BudgetHistoryDetailPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const todayIso = useTodayIso();
  const { subBudgets, deleteArchivedSubBudgetAction } = useBudgets();
  const { expenses } = useExpenses();

  const budget = subBudgets.find((item) => item.id === id);

  const overview = useMemo(() => {
    if (!budget) return null;
    const scoped = filterExpensesByBudget(expenses, budget.id);
    const range = { startIso: budget.startDate, endIso: budget.endDate };
    return computeOverviewForPeriodBudget({
      periodBudget: budget.totalAmount,
      expenses: scoped,
      range,
      todayIso,
    });
  }, [budget, expenses, todayIso]);

  useAppHeader({
    title: budget ? resolveBudgetLabel(budget, locale, t) : t('budget.history.title'),
  });

  if (!budget || !overview) {
    return (
      <p className="text-center text-slate-500 dark:text-slate-400 py-12">
        {t('budget.history.notFound')}
      </p>
    );
  }

  const { expense, budget: budgetColors } = SEMANTIC_COLORS;

  const handleDelete = async () => {
    await deleteArchivedSubBudgetAction(budget.id);
    navigate(ROUTES.budgetHistory);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('budget.history.dateRange')}</p>
        <p className="font-medium text-slate-800 dark:text-slate-100">
          {formatExpenseDateNumeric(budget.startDate, locale)} –{' '}
          {formatExpenseDateNumeric(budget.endDate, locale)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('budget.history.originalAmount')}</p>
          <p className={`text-xl font-bold tabular-nums ${budgetColors.valueText}`}>
            {formatCurrencyAmount(budget.totalAmount, locale)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('budget.history.totalSpent')}</p>
          <p className={`text-xl font-bold tabular-nums ${expense.valueText}`}>
            {formatCurrencyAmount(overview.totalPlanned, locale)}
          </p>
        </div>
      </div>

      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('budget.history.remaining')}</p>
        <p
          className={`text-xl font-bold tabular-nums ${
            overview.isOverspent ? expense.valueText : budgetColors.valueText
          }`}
        >
          {formatCurrencyAmount(Math.abs(overview.leftToSpend), locale)}
          {overview.isOverspent ? ` (${t('overview.overspent')})` : ''}
        </p>
      </div>

      <p className="text-sm text-slate-400 dark:text-slate-500">{t('budget.history.readOnly')}</p>

      <button
        type="button"
        onClick={() => void handleDelete()}
        className="w-full px-4 py-3 rounded-xl border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 font-medium min-h-[48px] hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
      >
        {t('budget.history.delete')}
      </button>
    </div>
  );
}
