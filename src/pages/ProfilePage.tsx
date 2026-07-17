import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppHeader } from '../app/hooks/useAppHeader';
import { UserAvatar } from '../features/profile/components/UserAvatar';
import { useAuthSession } from '../features/auth/hooks/useAuthSession';
import { useCategories } from '../features/categories/hooks/useCategories';
import { useExpenses } from '../features/expenses/hooks/useExpenses';
import { ExpenseEditModal } from '../features/expenses/components/ExpenseEditModal';
import {
  SettingsSection,
  TerminateRecurrenceConfirmModal,
  useRecurringExpensesSettings,
} from '../features/settings';
import { type AppLocale } from '../config/app';
import { getAllBuiltinSubCategoryIds, getSubCategoryI18nKey } from '../domain/categories/hierarchy';
import { resolveBilingualText } from '../domain/i18n/resolveBilingualText';

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as AppLocale;
  const { userId, displayName, isLoading } = useAuthSession();
  const { customCategories } = useCategories(userId);
  const { expenses, reload } = useExpenses(userId);

  const recurringSettings = useRecurringExpensesSettings({
    userId,
    expenses,
    reload,
    locale,
  });

  useAppHeader({ title: t('profile.pageTitle') });

  const greeting = isLoading
    ? null
    : userId === null
      ? t('profile.greetingGuest')
      : t('profile.greetingUser', {
          name: displayName ?? t('profile.defaultUserName'),
        });

  const categoryOptions = useMemo(
    () => [
      ...getAllBuiltinSubCategoryIds().map((id) => ({ id, label: t(getSubCategoryI18nKey(id)) })),
      ...customCategories.map((c) => ({
        id: c.id,
        label: resolveBilingualText(c.labels, locale),
      })),
    ],
    [customCategories, locale, t],
  );

  return (
    <div>
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <UserAvatar />
        {greeting !== null && (
          <p className="text-lg font-medium text-slate-700 dark:text-slate-200">{greeting}</p>
        )}
      </div>

      <SettingsSection
        activeTemplates={recurringSettings.activeTemplates}
        locale={locale}
        customCategories={customCategories}
        onEdit={recurringSettings.openEdit}
        onDelete={recurringSettings.openDelete}
      />

      {recurringSettings.editingTemplate && recurringSettings.editInput && (
        <ExpenseEditModal
          open
          input={recurringSettings.editInput}
          categoryOptions={categoryOptions}
          recurrenceSelection={recurringSettings.editRecurrenceSelection}
          existingAttachmentUrl={recurringSettings.editingTemplate.attachmentUrl}
          pendingAttachmentFile={recurringSettings.pendingAttachmentFile}
          removeAttachment={recurringSettings.removeAttachment}
          isSaving={recurringSettings.isSaving}
          errorKey={recurringSettings.errorKey}
          onChange={recurringSettings.setEditInput}
          onRecurrenceSelectionChange={recurringSettings.setEditRecurrenceSelection}
          onAttachmentFileChange={recurringSettings.setPendingAttachmentFile}
          onRemoveAttachment={() => recurringSettings.setRemoveAttachment(true)}
          onSave={() => void recurringSettings.saveEdit()}
          onClose={recurringSettings.closeEdit}
          hideDateField
          modalTitleKey="profile.settings.recurring.editTitle"
          occurrencesTitleKey="addExpense.recurrence.occurrencesRemainingTitle"
          occurrencesCustomLabelKey="addExpense.recurrence.occurrencesRemainingCustomLabel"
          minCustomOccurrences={0}
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
    </div>
  );
}
