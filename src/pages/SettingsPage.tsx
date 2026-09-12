import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { ExpenseEditModal } from '../features/expenses/components/ExpenseEditModal';
import { DEFAULT_RECURRENCE_SELECTION } from '../types/recurrenceRule';
import {
  SettingsSection,
  TerminateRecurrenceConfirmModal,
  DeleteScheduledExpenseConfirmModal,
  useRecurringExpensesSettings,
  useScheduledOneTimeExpensesSettings,
} from '../features/settings';
import { type AppLocale } from '../config/app';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';
import { buildBudgetScopedTitle } from '../domain/budget/buildBudgetScopedTitle';
import { filterExpensesByBudget } from '../domain/budget/filterExpensesByBudget';
import { resolveBudgetLabel } from '../domain/budget/resolveBudgetLabel';
import { resolveSubBudgetWindow } from '../domain/budget/subBudgetExpenseWindow';
import { useBudgets } from '../features/budget/hooks/useBudgets';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const { userId } = useAuthSession();
  const { subCategories } = useCategories(userId);
  const { expenses, reload } = useExpenses();
  const { activeBudgetId, activeBudget, isMaster, subBudgets } = useBudgets();

  const subBudgetWindow = resolveSubBudgetWindow(subBudgets, isMaster ? undefined : activeBudget.id);

  const scopedExpenses = useMemo(
    () => filterExpensesByBudget(expenses, activeBudgetId, subBudgets),
    [expenses, activeBudgetId, subBudgets],
  );

  const recurringSettings = useRecurringExpensesSettings({
    userId,
    expenses: scopedExpenses,
    reload,
    locale,
  });

  const scheduledSettings = useScheduledOneTimeExpensesSettings({
    userId,
    expenses: scopedExpenses,
    reload,
    locale,
  });

  useAppHeader({
    title: buildBudgetScopedTitle(
      t('nav.settings'),
      resolveBudgetLabel(activeBudget, locale, t),
    ),
  });

  const categoryOptions = useMemo(
    () =>
      subCategories.map((c) => ({
        id: c.id,
        label: resolveBilingualText(c.labels, locale),
      })),
    [subCategories, locale],
  );

  return (
    <div>
      <SettingsSection
        activeTemplates={recurringSettings.activeTemplates}
        scheduledExpenses={scheduledSettings.scheduledExpenses}
        expenses={scopedExpenses}
        locale={locale}
        subCategories={subCategories}
        onEditRecurring={recurringSettings.openEdit}
        onDeleteRecurring={recurringSettings.openDelete}
        onEditScheduled={scheduledSettings.openEdit}
        onDeleteScheduled={scheduledSettings.openDelete}
      />

      {recurringSettings.editingTemplate && recurringSettings.editInput && (
        <ExpenseEditModal
          open
          input={recurringSettings.editInput}
          categoryOptions={categoryOptions}
          recurrenceSelection={DEFAULT_RECURRENCE_SELECTION}
          existingAttachmentUrl={recurringSettings.editingTemplate.attachmentUrl}
          pendingAttachmentFile={recurringSettings.pendingAttachmentFile}
          removeAttachment={recurringSettings.removeAttachment}
          isSaving={recurringSettings.isSaving}
          errorKey={recurringSettings.errorKey}
          onChange={recurringSettings.setEditInput}
          onRecurrenceSelectionChange={() => {}}
          onAttachmentFileChange={recurringSettings.setPendingAttachmentFile}
          onRemoveAttachment={() => recurringSettings.setRemoveAttachment(true)}
          onSave={() => void recurringSettings.saveEdit()}
          onClose={recurringSettings.closeEdit}
          hideDateField
          hideRecurrenceField
          modalTitleKey="profile.settings.recurring.editTitle"
        />
      )}

      {scheduledSettings.editingExpense && scheduledSettings.editInput && (
        <ExpenseEditModal
          open
          input={scheduledSettings.editInput}
          categoryOptions={categoryOptions}
          recurrenceSelection={DEFAULT_RECURRENCE_SELECTION}
          existingAttachmentUrl={scheduledSettings.editingExpense.attachmentUrl}
          pendingAttachmentFile={scheduledSettings.pendingAttachmentFile}
          removeAttachment={scheduledSettings.removeAttachment}
          isSaving={scheduledSettings.isSaving}
          errorKey={scheduledSettings.errorKey}
          onChange={scheduledSettings.setEditInput}
          onRecurrenceSelectionChange={() => {}}
          onAttachmentFileChange={scheduledSettings.setPendingAttachmentFile}
          onRemoveAttachment={() => scheduledSettings.setRemoveAttachment(true)}
          onSave={() => void scheduledSettings.saveEdit()}
          onClose={scheduledSettings.closeEdit}
          hideRecurrenceField
          allowFutureDate
          maxSelectableDate={subBudgetWindow?.endDate}
          modalTitleKey="profile.settings.oneTime.editTitle"
        />
      )}

      <TerminateRecurrenceConfirmModal
        open={recurringSettings.deleteTarget !== null}
        target={recurringSettings.deleteTarget}
        locale={locale}
        isSaving={recurringSettings.isSaving}
        onConfirm={() => void recurringSettings.confirmDelete()}
        onDismiss={recurringSettings.dismissDelete}
      />

      <DeleteScheduledExpenseConfirmModal
        open={scheduledSettings.deleteTarget !== null}
        target={scheduledSettings.deleteTarget}
        locale={locale}
        isSaving={scheduledSettings.isSaving}
        onConfirm={() => void scheduledSettings.confirmDelete()}
        onDismiss={scheduledSettings.dismissDelete}
      />
    </div>
  );
}
