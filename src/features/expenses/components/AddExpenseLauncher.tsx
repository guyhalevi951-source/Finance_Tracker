import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, categorySubCreatePath, categorySubManagementPath } from '../../../config/routes';
import {
  beginAddExpenseCategoryCreate,
  beginAddExpenseSubCategoryCreate,
} from '../../../config/categoryNavigation';
import { type AppLocale } from '../../../config/app';
import { useAuthSession } from '../../auth/hooks/useAuthSession';
import { useCategories } from '../../categories/hooks/useCategories';
import { useExpenses } from '../hooks/useExpenses';
import { useAddExpenseFlow } from '../hooks/useAddExpenseFlow';
import { AddExpenseFab } from './AddExpenseFab';
import { AddExpenseFlowModal } from './AddExpenseFlowModal';

interface AddExpenseLauncherProps {
  locale: AppLocale;
  hideFab?: boolean;
  pendingOpen?: { parentId: string | null } | null;
  onPendingOpenHandled?: () => void;
  activeBudgetId: string;
  isMaster: boolean;
  subBudgetWindow?: { startDate: string; endDate: string } | null;
}

export function AddExpenseLauncher({
  locale,
  hideFab = false,
  pendingOpen,
  onPendingOpenHandled,
  activeBudgetId,
  isMaster,
  subBudgetWindow = null,
}: AddExpenseLauncherProps) {
  const navigate = useNavigate();
  const { userId } = useAuthSession();
  const { mainCategories, subCategories } = useCategories(userId);
  const { createExpense } = useExpenses();
  const addFlow = useAddExpenseFlow({ userId, createExpense, activeBudgetId, isMaster, subBudgetWindow });
  const { openFlow } = addFlow;
  const [initialCategoryParentId, setInitialCategoryParentId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingOpen) return;
    setInitialCategoryParentId(pendingOpen.parentId);
    openFlow();
    onPendingOpenHandled?.();
  }, [pendingOpen, openFlow, onPendingOpenHandled]);

  return (
    <>
      <AddExpenseFab
        onClick={() => {
          setInitialCategoryParentId(null);
          addFlow.openFlow();
        }}
        hidden={hideFab || addFlow.open}
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
          beginAddExpenseCategoryCreate();
          navigate(ROUTES.categoryManagement);
        }}
        onManageSubCategories={(parentId) => {
          beginAddExpenseSubCategoryCreate(parentId);
          navigate(categorySubManagementPath(parentId));
        }}
        onAddCategory={() => {
          beginAddExpenseCategoryCreate();
          navigate(ROUTES.categoryCreate);
        }}
        onAddSubCategory={(parentId) => {
          beginAddExpenseSubCategoryCreate(parentId);
          navigate(categorySubCreatePath(parentId));
        }}
        initialCategoryParentId={initialCategoryParentId}
        onSubmit={() => void addFlow.submit()}
        mainCategories={mainCategories}
        subCategories={subCategories}
        maxSelectableDate={subBudgetWindow?.endDate}
      />
    </>
  );
}
