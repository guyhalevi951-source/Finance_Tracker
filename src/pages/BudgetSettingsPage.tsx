import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { type AppLocale } from '../config/app';
import { ROUTES } from '../config/routes';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useMonthBudget } from '../features/budget/hooks/useMonthBudget';
import { useBudgets } from '../features/budget/hooks/useBudgets';
import { useSubBudgetEditor } from '../features/budget/hooks/useSubBudgetEditor';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { AddSubBudgetFab } from '../features/budget/components/AddSubBudgetFab';
import { SubBudgetList } from '../features/budget/components/SubBudgetList';

export function BudgetSettingsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const timeFilter = useExpenseTimeFilter(locale);
  const { activeSubBudgets, deleteSubBudgetAction, reorderSubBudgetsAction, setActiveBudgetId } =
    useBudgets();
  const { open, openAddSubBudget, openEditSubBudget } = useSubBudgetEditor();

  const {
    effectiveAmount,
    carryOverToNext,
    budgetSource,
    showCarryOverCheckbox,
    budgetInput,
    showBudgetSaved,
    loadError,
    setBudgetInput,
    handleSetBudget,
    handleCarryOverChange,
    handleResetBudget,
  } = useMonthBudget(timeFilter.year, timeFilter.month);

  const [isDeleting, setIsDeleting] = useState(false);

  useAppHeader({ title: t('budget.pageTitle') });

  const handleOpenOverview = useCallback(
    (budgetId: string) => {
      setActiveBudgetId(budgetId);
    },
    [setActiveBudgetId],
  );

  const handleDelete = async (id: string, deleteExpenses: boolean) => {
    setIsDeleting(true);
    try {
      await deleteSubBudgetAction(id, deleteExpenses);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative pb-24">
      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <Link
          to={ROUTES.budgetHistory}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 min-h-[44px]"
        >
          <History className="w-4 h-4" />
          {t('budget.history.link')}
        </Link>
      </div>

      <SubBudgetList
        locale={locale}
        subBudgets={activeSubBudgets}
        masterBudget={{
          year: timeFilter.year,
          month: timeFilter.month,
          monthLabel: timeFilter.monthLabel,
          goToPreviousMonth: timeFilter.goToPreviousMonth,
          goToNextMonth: timeFilter.goToNextMonth,
          selectMonth: timeFilter.selectMonth,
          monthBudget: {
            effectiveAmount,
            carryOverToNext,
            budgetSource,
            showCarryOverCheckbox,
            budgetInput,
            showBudgetSaved,
            setBudgetInput,
            handleSetBudget,
            handleCarryOverChange,
            handleResetBudget,
          },
        }}
        onReorder={(orderedIds) => void reorderSubBudgetsAction(orderedIds)}
        onEdit={openEditSubBudget}
        onDelete={handleDelete}
        onOpenOverview={handleOpenOverview}
        isDeleting={isDeleting}
      />

      <AddSubBudgetFab onClick={openAddSubBudget} hidden={open} />
    </div>
  );
}
