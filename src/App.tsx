import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  TrendingDown,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  Utensils,
  Heart,
  Film,
  Home,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { BUILTIN_CATEGORY_IDS, type BuiltinCategoryId } from './domain/categories/constants';
import { isBuiltinCategoryId, resolveCustomCategoryLabel } from './domain/categories/resolveCategoryLabel';
import { resolveBilingualText } from './domain/i18n/resolveBilingualText';
import { useBudgetTracker } from './features/budget/hooks/useBudgetTracker';
import { useCategories } from './features/categories/hooks/useCategories';
import { useAuthSession } from './features/auth/hooks/useAuthSession';
import { LanguageToggle } from './features/i18n/components/LanguageToggle';
import { formatDate, formatNumber } from './lib/format/formatDate';
import { type AppLocale } from './config/app';

const CATEGORY_UI: Record<BuiltinCategoryId, { icon: LucideIcon; color: string }> = {
  food: { icon: Utensils, color: 'bg-amber-500' },
  health: { icon: Heart, color: 'bg-rose-500' },
  entertainment: { icon: Film, color: 'bg-purple-500' },
  rent: { icon: Home, color: 'bg-cyan-500' },
  other: { icon: HelpCircle, color: 'bg-gray-500' },
};

function getCategoryUI(id: string) {
  if (isBuiltinCategoryId(id)) return CATEGORY_UI[id];
  return CATEGORY_UI['other'];
}

function App() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;

  const { userId } = useAuthSession();

  const {
    budget,
    budgetInput,
    expenses,
    newExpense,
    summary,
    showBudgetSaved,
    loadError,
    isAddingExpense,
    addExpenseError,
    setBudgetInput,
    setNewExpense,
    handleSetBudget,
    handleAddExpense,
    handleDeleteExpense,
    clearAddExpenseError,
  } = useBudgetTracker();

  const {
    customCategories,
    isAddingCategory,
    addCategoryError,
    loadCategoryError,
    addCustomCategory,
    clearAddCategoryError,
    clearLoadCategoryError,
  } = useCategories(userId);

  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const { totalExpenses, budgetPercentage, isOverBudget, remaining } = summary;

  const allCategoryOptions = [
    ...BUILTIN_CATEGORY_IDS.map((id) => ({ id, label: t(`category.${id}`) })),
    ...customCategories.map((c) => ({
      id: c.id,
      label: resolveBilingualText(c.labels, locale),
    })),
  ];

  const handleAddCustomCategory = async () => {
    if (!customCategoryInput.trim()) return;
    await addCustomCategory(customCategoryInput.trim(), locale);
    if (!addCategoryError) setCustomCategoryInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{t('app.name')}</h1>
                <p className="text-slate-500 text-sm">{t('app.tagline')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <span className="text-sm text-slate-400">
                {formatDate(new Date(), locale)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Load error banner */}
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-6 text-sm">
            {t('errors.corruptedData')}
          </div>
        )}

        {/* Category load error banner */}
        {loadCategoryError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-6 text-sm flex justify-between items-center">
            <span>{t('category.loadError')}</span>
            <button
              onClick={clearLoadCategoryError}
              className="ml-4 text-amber-600 hover:text-amber-800 font-semibold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Translation error banner */}
        {addExpenseError && (
          <div
            className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 mb-6 text-sm flex justify-between items-center"
          >
            <span>{t('expense.translationError')}</span>
            <button
              onClick={clearAddExpenseError}
              className="ml-4 text-rose-600 hover:text-rose-800 font-semibold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Budget Setter */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">{t('budget.title')}</h2>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[180px] max-w-xs">
              <label className="block text-sm font-medium text-slate-600 mb-2">
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-lg"
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

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Budget Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">{t('budget.card.monthlyBudget')}</span>
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">₪{formatNumber(budget, locale)}</p>
            <p className="text-sm text-slate-400 mt-2">{t('budget.card.allocated')}</p>
          </div>

          {/* Total Expenses Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">{t('budget.card.totalExpenses')}</span>
              <div className="bg-rose-100 p-2 rounded-lg">
                <TrendingDown className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
              ₪{formatNumber(totalExpenses, locale)}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {t('budget.card.expensesThisMonth', { count: expenses.length })}
            </p>
          </div>

          {/* Budget Status Card */}
          <div className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
            isOverBudget ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">{t('budget.card.budgetStatus')}</span>
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

            <p className={`text-2xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
              {remaining >= 0
                ? `₪${formatNumber(remaining, locale)}`
                : `-₪${formatNumber(Math.abs(remaining), locale)}`}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {remaining >= 0 ? t('budget.card.remaining') : t('budget.card.overBudget')}
            </p>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{t('budget.card.usage')}</span>
                <span>{Math.min(100, budgetPercentage).toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
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

        {/* Add Expense Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            {t('expense.formTitle')}
          </h2>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('expense.descriptionLabel')}
              </label>
              <input
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder={t('expense.descriptionPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                required
                disabled={isAddingExpense}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('expense.amountLabel')}
              </label>
              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder={t('expense.amountPlaceholder')}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                min="0"
                step="0.01"
                required
                disabled={isAddingExpense}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                {t('expense.categoryLabel')}
              </label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all bg-white"
                disabled={isAddingExpense}
              >
                {allCategoryOptions.map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Add custom category inline */}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => {
                    setCustomCategoryInput(e.target.value);
                    if (addCategoryError) clearAddCategoryError();
                  }}
                  placeholder={t('category.addCustomPlaceholder')}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 outline-none transition-all"
                  disabled={isAddingCategory}
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  disabled={isAddingCategory || !customCategoryInput.trim()}
                  className="px-3 py-2 text-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                >
                  {isAddingCategory ? t('category.addingCustomButton') : t('category.addCustomButton')}
                </button>
              </div>
              {addCategoryError && (
                <p className="text-xs text-rose-600 mt-1">{t('category.customTranslationError')}</p>
              )}
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

        {/* Expenses Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-700">{t('expense.tableTitle')}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {t('expense.tableCount', { count: expenses.length })}
            </p>
          </div>

          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg">{t('expense.empty.title')}</p>
              <p className="text-slate-400 text-sm mt-1">{t('expense.empty.subtitle')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-start px-6 py-4 text-sm font-semibold text-slate-600">
                      {t('expense.tableHeaderDescription')}
                    </th>
                    <th className="text-start px-6 py-4 text-sm font-semibold text-slate-600">
                      {t('expense.tableHeaderAmount')}
                    </th>
                    <th className="text-start px-6 py-4 text-sm font-semibold text-slate-600">
                      {t('expense.tableHeaderCategory')}
                    </th>
                    <th className="text-start px-6 py-4 text-sm font-semibold text-slate-600">
                      {t('expense.tableHeaderDate')}
                    </th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {t('expense.tableHeaderActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((expense) => {
                    const { icon: Icon, color } = getCategoryUI(expense.category);
                    const categoryLabel = isBuiltinCategoryId(expense.category)
                      ? t(`category.${expense.category}`)
                      : (resolveCustomCategoryLabel(expense.category, customCategories, locale) ?? t('category.other'));

                    return (
                      <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-800">
                            {resolveBilingualText(expense.description, locale)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-semibold text-slate-800">
                            ₪{formatNumber(expense.amount, locale)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${color} text-white`}>
                            <Icon className="w-4 h-4" />
                            {categoryLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {expense.date}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title={t('expense.deleteTitle')}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Footer */}
          {expenses.length > 0 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">{t('expense.totalExpenses')}</span>
                <span className={`text-2xl font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}`}>
                  ₪{formatNumber(totalExpenses, locale)}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-400">
            {t('footer.text')}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
