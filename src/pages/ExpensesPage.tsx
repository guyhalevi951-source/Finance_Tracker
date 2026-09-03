import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { expenseDetailPath } from '../config/routes';
import {
  type ExpensesLocationState,
} from '../config/categoryNavigation';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { useExpenseBatchMode } from '../features/expenses/hooks/useExpenseBatchMode';
import { ExpensesHeaderActions } from '../features/expenses/components/ExpensesHeaderActions';
import { ExpenseFilterToolbar } from '../features/expenses/components/ExpenseFilterToolbar';
import { ExpensesByDateView } from '../features/expenses/components/ExpensesByDateView';
import { ExpensesByCategoryView } from '../features/expenses/components/ExpensesByCategoryView';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { usePeriodVisibleExpenses } from '../features/expenses/hooks/usePeriodVisibleExpenses';
import { type ExpensesViewMode } from '../features/expenses/components/ExpensesViewTabs';
import { ExpenseEditModal } from '../features/expenses/components/ExpenseEditModal';
import { DiscardChangesModal } from '../features/expenses/components/DiscardChangesModal';
import { RecurringEditConfirmModal } from '../features/expenses/components/RecurringEditConfirmModal';
import { RecurringInstanceLinkConfirmModal } from '../features/expenses/components/RecurringInstanceLinkConfirmModal';
import { DEFAULT_RECURRENCE_SELECTION } from '../types/recurrenceRule';
import { AddExpenseLauncher } from '../features/expenses/components/AddExpenseLauncher';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';
import { buildBudgetScopedTitle } from '../domain/budget/buildBudgetScopedTitle';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { useBudgets } from '../features/budget/hooks/useBudgets';
import { type Expense } from '../types/expense';

export function ExpensesPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<ExpensesViewMode>('date');
  const [pendingAddOpen, setPendingAddOpen] = useState<{ parentId: string | null } | null>(null);

  const { userId } = useAuthSession();
  const { mainCategories, subCategories } = useCategories(userId);
  const { expenses, loadError, reload } = useExpenses();
  const { activeBudgetId, activeBudget, isMaster, subBudgets } = useBudgets();

  useEffect(() => {
    const state = location.state as ExpensesLocationState | null;
    if (state?.openAddExpenseSubCategories) {
      setPendingAddOpen({ parentId: state.openAddExpenseSubCategories });
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    if (state?.openAddExpenseCategories) {
      setPendingAddOpen({ parentId: null });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const timeFilter = useExpenseTimeFilter(locale);
  const batch = useExpenseBatchMode(expenses, userId, reload, timeFilter.todayIso);

  const filteredExpenses = usePeriodVisibleExpenses(
    batch.displayExpenses,
    timeFilter.range,
    activeBudgetId,
    timeFilter.todayIso,
  );

  const subBudget =
    !isMaster && 'name' in activeBudget ? activeBudget : null;
  const subBudgetWindow = subBudget
    ? { startDate: subBudget.startDate, endDate: subBudget.endDate }
    : null;

  const categoryOptions = subCategories.map((c) => ({
    id: c.id,
    label: resolveBilingualText(c.labels, locale),
  }));

  const handleItemClick = (expense: Expense) => {
    if (batch.mode === 'deleting') {
      batch.toggleSelected(expense.id);
      return;
    }
    if (batch.mode === 'editing') {
      batch.openEditModal(expense);
      return;
    }
    navigate(expenseDetailPath(expense.id));
  };

  const listProps = {
    expenses: filteredExpenses,
    locale,
    mainCategories,
    subCategories,
    subBudgets,
    isMaster,
    mode: batch.mode,
    selectedIds: batch.selectedIds,
    onItemClick: handleItemClick,
  };

  const headerActions = useMemo(
    () => (
      <ExpensesHeaderActions
        mode={batch.mode}
        isSaving={batch.isSaving}
        onEnterDelete={batch.enterDeleteMode}
        onEnterEdit={batch.enterEditMode}
        onConfirm={() => void batch.confirmMode()}
        onCancel={batch.requestCancel}
      />
    ),
    [
      batch.mode,
      batch.isSaving,
      batch.enterDeleteMode,
      batch.enterEditMode,
      batch.confirmMode,
      batch.requestCancel,
    ],
  );

  useAppHeader({
    title: buildBudgetScopedTitle(
      resolveBudgetLabel(activeBudget, locale, t),
      t('expense.pageTitle'),
      isMaster,
    ),
    actions: headerActions,
  });

  return (
    <div className="relative pb-20">
      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      {batch.batchError && (
        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t(batch.batchError)}
        </div>
      )}

      <ExpenseFilterToolbar
        locale={locale}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        {...timeFilter}
      />

      {viewMode === 'date' ? (
        <ExpensesByDateView {...listProps} />
      ) : (
        <ExpensesByCategoryView {...listProps} />
      )}

      {batch.editInput && (
        <ExpenseEditModal
          open={batch.editingExpense !== null}
          input={batch.editInput}
          categoryOptions={categoryOptions}
          recurrenceSelection={DEFAULT_RECURRENCE_SELECTION}
          existingAttachmentUrl={batch.editingExpense?.attachmentUrl}
          pendingAttachmentFile={batch.pendingAttachmentFile}
          removeAttachment={batch.removeAttachment}
          isSaving={batch.isSaving}
          errorKey={batch.editError}
          onChange={batch.setEditInput}
          onRecurrenceSelectionChange={() => {}}
          onAttachmentFileChange={(file) => {
            batch.setPendingAttachmentFile(file);
            if (file) {
              batch.setRemoveAttachment(false);
            }
          }}
          onRemoveAttachment={() => {
            batch.setPendingAttachmentFile(null);
            batch.setRemoveAttachment(true);
          }}
          onSave={() => void batch.saveLocalEdit()}
          onClose={batch.closeEditModal}
          hideDateField={batch.isEditingRecurringExpense}
          hideRecurrenceField
        />
      )}

      <RecurringEditConfirmModal
        open={batch.showRecurringEditModal}
        isSaving={batch.isSaving}
        onConfirm={(scope) => void batch.confirmRecurringEdit(scope)}
        onDismiss={batch.dismissRecurringEdit}
      />

      <RecurringInstanceLinkConfirmModal
        open={batch.showRecurringInstanceLinkModal}
        isSaving={batch.isSaving}
        onConfirm={(link) => void batch.confirmInstanceOnlyEdit(link)}
        onDismiss={batch.dismissInstanceOnlyEdit}
      />

      <DiscardChangesModal
        open={batch.showDiscardModal}
        onConfirm={batch.confirmDiscard}
        onDismiss={batch.dismissDiscard}
      />

      <AddExpenseLauncher
        locale={locale}
        hideFab={batch.mode !== 'view'}
        pendingOpen={pendingAddOpen}
        onPendingOpenHandled={() => setPendingAddOpen(null)}
        activeBudgetId={activeBudgetId}
        isMaster={isMaster}
        subBudgetWindow={subBudgetWindow}
      />
    </div>
  );
}
