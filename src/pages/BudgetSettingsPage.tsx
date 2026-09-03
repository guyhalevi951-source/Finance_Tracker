import { useTranslation } from 'react-i18next';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useMonthBudget } from '../features/budget/hooks/useMonthBudget';
import { BudgetSettingsCard } from '../features/budget/components/BudgetSettingsCard';
import { ExpenseFilterToolbar } from '../features/expenses/components/ExpenseFilterToolbar';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';

export function BudgetSettingsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const timeFilter = useExpenseTimeFilter(locale);

  const {
    effectiveAmount,
    carryOverToNext,
    budgetInput,
    showBudgetSaved,
    loadError,
    setBudgetInput,
    handleSetBudget,
    handleCarryOverChange,
  } = useMonthBudget(timeFilter.year, timeFilter.month);

  useAppHeader({ title: t('budget.pageTitle') });

  return (
    <div>
      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      <ExpenseFilterToolbar
        locale={locale}
        showViewModeToggle={false}
        showGranularityToggle={false}
        {...timeFilter}
      />

      <BudgetSettingsCard
        effectiveAmount={effectiveAmount}
        carryOverToNext={carryOverToNext}
        budgetInput={budgetInput}
        showBudgetSaved={showBudgetSaved}
        locale={locale}
        setBudgetInput={setBudgetInput}
        handleSetBudget={handleSetBudget}
        handleCarryOverChange={handleCarryOverChange}
      />
    </div>
  );
}
