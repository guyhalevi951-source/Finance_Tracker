import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { expenseDetailPath, ROUTES, categorySubManagementPath } from '../config/routes';
import {
  CATEGORY_RETURN_SUB_PARENT_KEY,
  CATEGORY_RETURN_TO_ADD_EXPENSE_KEY,
  type ExpensesLocationState,
} from '../config/categoryNavigation';
import { type AppLocale } from '../config/app';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { useAddExpenseFlow } from '../features/expenses/hooks/useAddExpenseFlow';
import { useExpenseBatchMode } from '../features/expenses/hooks/useExpenseBatchMode';
import { ExpensesHeaderActions } from '../features/expenses/components/ExpensesHeaderActions';
import { ExpensesViewTabs, type ExpensesViewMode } from '../features/expenses/components/ExpensesViewTabs';
import { ExpenseTimeFilterBar } from '../features/expenses/components/ExpenseTimeFilterBar';
import { ExpensesByDateView } from '../features/expenses/components/ExpensesByDateView';
import { ExpensesByCategoryView } from '../features/expenses/components/ExpensesByCategoryView';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { filterExpensesByPeriod } from '../domain/expenses/periods';
import { ExpenseEditModal } from '../features/expenses/components/ExpenseEditModal';
import { DiscardChangesModal } from '../features/expenses/components/DiscardChangesModal';
import { RecurringDeleteConfirmModal } from '../features/expenses/components/RecurringDeleteConfirmModal';
import { UnifiedRecurringBulkDeleteModal } from '../features/expenses/components/UnifiedRecurringBulkDeleteModal';
import { RecurringEditConfirmModal } from '../features/expenses/components/RecurringEditConfirmModal';
import { RecurringInstanceLinkConfirmModal } from '../features/expenses/components/RecurringInstanceLinkConfirmModal';
import { DEFAULT_RECURRENCE_SELECTION } from '../types/recurrenceRule';
import { AddExpenseFab } from '../features/expenses/components/AddExpenseFab';
import { AddExpenseFlowModal } from '../features/expenses/components/AddExpenseFlowModal';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';
import { type Expense } from '../types/expense';

export function ExpensesPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<ExpensesViewMode>('date');
  const [initialCategoryParentId, setInitialCategoryParentId] = useState<string | null>(null);

  const { userId } = useAuthSession();
  const { mainCategories, subCategories } = useCategories(userId);
  const { expenses, loadError, reload, createExpense } = useExpenses();
  const addFlow = useAddExpenseFlow({ userId, createExpense });
  const { openFlow } = addFlow;

  useEffect(() => {
    const state = location.state as ExpensesLocationState | null;
    if (state?.openAddExpenseSubCategories) {
      setInitialCategoryParentId(state.openAddExpenseSubCategories);
      openFlow();
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    if (state?.openAddExpenseCategories) {
      setInitialCategoryParentId(null);
      openFlow();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, openFlow, navigate]);

  const timeFilter = useExpenseTimeFilter(locale);
  const batch = useExpenseBatchMode(expenses, userId, reload, timeFilter.todayIso);

  const filteredExpenses = useMemo(
    () => filterExpensesByPeriod(batch.displayExpenses, timeFilter.range),
    [batch.displayExpenses, timeFilter.range],
  );

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

  useAppHeader({ title: t('expense.pageTitle'), actions: headerActions });

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

      <ExpensesViewTabs active={viewMode} onChange={setViewMode} />

      <ExpenseTimeFilterBar locale={locale} {...timeFilter} />

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
          hideRecurrenceField={batch.isEditingRecurringExpense}
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

      <UnifiedRecurringBulkDeleteModal
        open={batch.showUnifiedBulkDeleteModal}
        group={batch.bulkDeleteGroup}
        subCategories={subCategories}
        locale={locale}
        isSaving={batch.isSaving}
        onConfirm={(scope) => void batch.confirmUnifiedBulkDelete(scope)}
        onDismiss={batch.dismissRecurringDelete}
      />

      <RecurringDeleteConfirmModal
        open={batch.showRecurringDeleteModal}
        target={batch.recurringDeleteTarget}
        expenses={batch.pendingDeleteDraft}
        todayIso={timeFilter.todayIso}
        subCategories={subCategories}
        locale={locale}
        queueIndex={batch.recurringDeleteQueueIndex}
        queueTotal={batch.recurringDeleteQueueTotal}
        isSaving={batch.isSaving}
        onConfirm={(scope) => void batch.confirmRecurringDelete(scope)}
        onDismiss={batch.dismissRecurringDelete}
      />

      <AddExpenseFab
        onClick={() => {
          setInitialCategoryParentId(null);
          addFlow.openFlow();
        }}
        hidden={addFlow.open || batch.mode !== 'view'}
      />
      <AddExpenseFlowModal
        open={addFlow.open}
        step={addFlow.step}
        locale={locale}
        selectedSubCategoryId={addFlow.selectedSubCategoryId}
        amountDigits={addFlow.amountDigits}
        onAmountChange={addFlow.setAmountDigits}
        note={addFlow.note}
        onNoteChange={addFlow.setNote}
        date={addFlow.date}
        onDateChange={addFlow.setDate}
        paymentMethod={addFlow.paymentMethod}
        onPaymentMethodChange={addFlow.setPaymentMethod}
        recurrenceSelection={addFlow.recurrenceSelection}
        onRecurrenceSelectionChange={addFlow.setRecurrenceSelection}
        attachmentFile={addFlow.attachmentFile}
        onAttachmentChange={addFlow.setAttachmentFile}
        isSaving={addFlow.isSaving}
        errorKey={addFlow.errorKey}
        onClose={() => {
          setInitialCategoryParentId(null);
          addFlow.closeFlow();
        }}
        onSelectSubCategory={addFlow.selectSubCategory}
        onBackToCategories={addFlow.goBackToCategories}
        onManageCategories={() => {
          sessionStorage.setItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY, '1');
          sessionStorage.removeItem(CATEGORY_RETURN_SUB_PARENT_KEY);
          addFlow.closeFlow();
          navigate(ROUTES.categoryManagement);
        }}
        onManageSubCategories={(parentId) => {
          sessionStorage.setItem(CATEGORY_RETURN_TO_ADD_EXPENSE_KEY, '1');
          sessionStorage.setItem(CATEGORY_RETURN_SUB_PARENT_KEY, parentId);
          addFlow.closeFlow();
          navigate(categorySubManagementPath(parentId));
        }}
        initialCategoryParentId={initialCategoryParentId}
        onSubmit={() => void addFlow.submit()}
        mainCategories={mainCategories}
        subCategories={subCategories}
      />
    </div>
  );
}
