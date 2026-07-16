import { useTranslation } from 'react-i18next';
import {
  Wallet,
  TrendingDown,
  AlertTriangle,
  Plus,
  Check,
} from 'lucide-react';
import { BUILTIN_CATEGORY_IDS } from '../domain/categories/constants';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';
import { useBudgetTracker } from '../features/budget/hooks/useBudgetTracker';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { formatNumber } from '../lib/format/formatDate';
import { type AppLocale } from '../config/app';
import { PAYMENT_METHOD_IDS } from '../domain/expenses/paymentMethods';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;

  const { userId } = useAuthSession();
  const { expenses, newExpense, setNewExpense, isAddingExpense, addExpenseError, addExpense, clearAddExpenseError, loadError: expensesLoadError } = useExpenses(userId);
  const { budget, budgetInput, summary, showBudgetSaved, loadError: budgetLoadError, setBudgetInput, handleSetBudget } = useBudgetTracker(expenses);
  const { customCategories, loadCategoryError, clearLoadCategoryError } = useCategories(userId);

  const { totalExpenses, budgetPercentage, isOverBudget, remaining } = summary;
  const loadError = budgetLoadError || expensesLoadError;

  const allCategoryOptions = [
    ...BUILTIN_CATEGORY_IDS.map((id) => ({ id, label: t(`category.${id}`) })),
    ...customCategories.map((c) => ({
      id: c.id,
      label: resolveBilingualText(c.labels, locale),
    })),
  ];

  return (
    <div>
      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      {loadCategoryError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm flex justify-between items-center">
          <span>{t('category.loadError')}</span>
          <button
            onClick={clearLoadCategoryError}
            className="ms-4 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 font-semibold text-xs min-h-[44px] min-w-[44px]"
          >
            ✕
          </button>
        </div>
      )}

      {addExpenseError && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300 rounded-xl px-4 py-3 mb-6 text-sm flex justify-between items-center">
          <span>{t('expense.translationError')}</span>
          <button
            onClick={clearAddExpenseError}
            className="ms-4 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 font-semibold text-xs min-h-[44px] min-w-[44px]"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8 transition-colors duration-200">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('budget.title')}</h2>
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('budget.amountLabel')}
            </label>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder={
                budget > 0
                  ? t('budget.amountPlaceholderWithCurrent', { amount: formatNumber(budget, locale) })
                  : t('budget.amountPlaceholder')
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 outline-none transition-all text-lg"
              min="0"
              step="100"
            />
          </div>
          <button
            onClick={handleSetBudget}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 min-h-[48px]"
          >
            {showBudgetSaved ? (
              <>
                <Check className="w-5 h-5" />
                {t('budget.savedButton')}
              </>
            ) : (
              t('budget.updateButton')
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('budget.card.monthlyBudget')}</span>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">₪{formatNumber(budget, locale)}</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{t('budget.card.allocated')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('budget.card.totalExpenses')}</span>
            <div className="bg-rose-100 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
            ₪{formatNumber(totalExpenses, locale)}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            {t('budget.card.expensesThisMonth', { count: expenses.length })}
          </p>
        </div>

        <div className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${
          isOverBudget ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('budget.card.budgetStatus')}</span>
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
          <p className={`text-2xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>
            {remaining >= 0
              ? `₪${formatNumber(remaining, locale)}`
              : `-₪${formatNumber(Math.abs(remaining), locale)}`}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            {remaining >= 0 ? t('budget.card.remaining') : t('budget.card.overBudget')}
          </p>
          <div className="mt-4">
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
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors duration-200">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-500" />
          {t('expense.formTitle')}
        </h2>

        <form onSubmit={(e) => void addExpense(e)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.descriptionLabel')}
            </label>
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              placeholder={t('expense.descriptionPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 outline-none transition-all"
              required
              disabled={isAddingExpense}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.amountLabel')}
            </label>
            <input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              placeholder={t('expense.amountPlaceholder')}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 outline-none transition-all"
              min="0"
              step="0.01"
              required
              disabled={isAddingExpense}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.categoryLabel')}
            </label>
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 outline-none transition-all"
              disabled={isAddingExpense}
            >
              {allCategoryOptions.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.paymentMethodLabel')}
            </label>
            <select
              value={newExpense.paymentMethod}
              onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 outline-none transition-all"
              disabled={isAddingExpense}
            >
              {PAYMENT_METHOD_IDS.map((id) => (
                <option key={id} value={id}>{t(`expense.paymentMethod.${id}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              {t('expense.dateLabel')}
            </label>
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-800 outline-none transition-all"
              required
              disabled={isAddingExpense}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAddingExpense}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
            >
              {isAddingExpense ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('expense.addingButton')}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {t('expense.addButton')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
