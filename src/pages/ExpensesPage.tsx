import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { expenseDetailPath } from '../config/routes';
import { type AppLocale } from '../config/app';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { useAddExpenseFlow } from '../features/expenses/hooks/useAddExpenseFlow';
import { useExpenseBatchMode } from '../features/expenses/hooks/useExpenseBatchMode';
import { ExpensesPageHeader } from '../features/expenses/components/ExpensesPageHeader';
import { ExpensesViewTabs, type ExpensesViewMode } from '../features/expenses/components/ExpensesViewTabs';
import { ExpenseTimeFilterBar } from '../features/expenses/components/ExpenseTimeFilterBar';
import { ExpensesByDateView } from '../features/expenses/components/ExpensesByDateView';
import { ExpensesByCategoryView } from '../features/expenses/components/ExpensesByCategoryView';
import { useExpenseTimeFilter } from '../features/expenses/hooks/useExpenseTimeFilter';
import { filterExpensesByPeriod } from '../domain/expenses/periods';
import { ExpenseEditModal } from '../features/expenses/components/ExpenseEditModal';
import { DiscardChangesModal } from '../features/expenses/components/DiscardChangesModal';
import { AddExpenseFab } from '../features/expenses/components/AddExpenseFab';
import { AddExpenseFlowModal } from '../features/expenses/components/AddExpenseFlowModal';
import { getAllBuiltinSubCategoryIds, getSubCategoryI18nKey } from '../domain/categories/hierarchy';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';
import { type Expense } from '../types/expense';

export function ExpensesPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ExpensesViewMode>('date');

  const { userId } = useAuthSession();
  const { customCategories } = useCategories(userId);
  const { expenses, loadError, reload, createExpense } = useExpenses(userId);
  const addFlow = useAddExpenseFlow({ userId, createExpense });

  const batch = useExpenseBatchMode(expenses, userId, reload);
  const timeFilter = useExpenseTimeFilter(locale);

  const filteredExpenses = useMemo(
    () => filterExpensesByPeriod(batch.displayExpenses, timeFilter.range),
    [batch.displayExpenses, timeFilter.range],
  );

  const categoryOptions = [
    ...getAllBuiltinSubCategoryIds().map((id) => ({ id, label: t(getSubCategoryI18nKey(id)) })),
    ...customCategories.map((c) => ({
      id: c.id,
      label: resolveBilingualText(c.labels, locale),
    })),
  ];

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
    customCategories,
    mode: batch.mode,
    selectedIds: batch.selectedIds,
    onItemClick: handleItemClick,
  };

  return (
    <div className="relative pb-20">
      {loadError && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('errors.corruptedData')}
        </div>
      )}

      <ExpensesPageHeader
        mode={batch.mode}
        isSaving={batch.isSaving}
        onEnterDelete={batch.enterDeleteMode}
        onEnterEdit={batch.enterEditMode}
        onConfirm={() => void batch.confirmMode()}
        onCancel={batch.requestCancel}
      />

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
          isSaving={batch.isSaving}
          errorKey={batch.editError}
          onChange={batch.setEditInput}
          onSave={() => void batch.saveLocalEdit()}
          onClose={batch.closeEditModal}
        />
      )}

      <DiscardChangesModal
        open={batch.showDiscardModal}
        onConfirm={batch.confirmDiscard}
        onDismiss={batch.dismissDiscard}
      />

      <AddExpenseFab onClick={addFlow.openFlow} hidden={addFlow.open} />
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
        attachmentFile={addFlow.attachmentFile}
        onAttachmentChange={addFlow.setAttachmentFile}
        isSaving={addFlow.isSaving}
        errorKey={addFlow.errorKey}
        onClose={addFlow.closeFlow}
        onSelectSubCategory={addFlow.selectSubCategory}
        onBackToCategories={addFlow.goBackToCategories}
        onSubmit={() => void addFlow.submit()}
      />
    </div>
  );
}
