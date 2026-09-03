import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { type AppLocale } from '../config/app';
import { ROUTES } from '../config/routes';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useMonthBudget } from '../features/budget/hooks/useMonthBudget';
import { useBudgets } from '../features/budget/hooks/useBudgets';
import { BudgetSettingsCard } from '../features/budget/components/BudgetSettingsCard';
import { ExpenseFilterToolbar } from '../features/expenses/components/ExpenseFilterToolbar';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { AddSubBudgetFab } from '../features/budget/components/AddSubBudgetFab';
import { SubBudgetList } from '../features/budget/components/SubBudgetList';
import { SubBudgetEditorModal } from '../features/budget/components/SubBudgetEditorModal';
import { type SubBudgetRecord } from '../types/budget';

export function BudgetSettingsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const timeFilter = useExpenseTimeFilter(locale);
  const { isMaster, activeSubBudgets, addSubBudget, updateSubBudget, deleteSubBudgetAction, reorderSubBudgetsAction } =
    useBudgets();

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

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<SubBudgetRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useAppHeader({ title: t('budget.pageTitle') });

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setEditorOpen(true);
  };

  const handleEdit = (budget: SubBudgetRecord) => {
    setEditingBudget(budget);
    setEditorOpen(true);
  };

  const handleSave = async (input: Parameters<typeof addSubBudget>[0]) => {
    setIsSaving(true);
    try {
      if (editingBudget) {
        await updateSubBudget(editingBudget.id, input);
      } else {
        await addSubBudget(input);
      }
    } finally {
      setIsSaving(false);
    }
  };

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

      {isMaster && (
        <>
          <ExpenseFilterToolbar
            locale={locale}
            showViewModeToggle={false}
            showGranularityToggle={false}
            {...timeFilter}
          />

          <div className="mb-8">
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
        </>
      )}

      <SubBudgetList
        locale={locale}
        subBudgets={activeSubBudgets}
        onReorder={(orderedIds) => void reorderSubBudgetsAction(orderedIds)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      <AddSubBudgetFab onClick={handleOpenAdd} hidden={editorOpen} />

      <SubBudgetEditorModal
        open={editorOpen}
        locale={locale}
        editingBudget={editingBudget}
        isSaving={isSaving}
        onSave={handleSave}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}
