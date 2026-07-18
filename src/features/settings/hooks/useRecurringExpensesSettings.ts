import { useCallback, useMemo, useState } from 'react';
import { type Expense } from '../../../types/expense';
import { type AppLocale } from '../../../config/app';
import { validateExpenseInput, type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import { applyRecurringSettingsFieldUpdate, resolveSettingsSeriesDisplayFields } from '../../../domain/recurrence/applyRecurringSettingsFieldUpdate';
import { listActiveRecurrenceTemplates } from '../../../domain/recurrence/listActiveRecurrenceTemplates';
import { terminateRecurrenceSeries } from '../../../domain/recurrence/terminateRecurrenceSeries';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { useTodayIso } from '../../../lib/hooks/useTodayIso';
import { applyExpenseBatch } from '../../../services/expenses/expenseRepository';
import {
  deleteExpenseAttachment,
  uploadExpenseAttachment,
} from '../../../services/attachments/expenseAttachmentService';
import { createBilingualText } from '../../../services/translation/createBilingualText';

export interface UseRecurringExpensesSettingsParams {
  userId: string | null;
  expenses: Expense[];
  reload: () => Promise<void>;
  locale: AppLocale;
}

export function useRecurringExpensesSettings({
  userId,
  expenses,
  reload,
  locale,
}: UseRecurringExpensesSettingsParams) {
  const todayIso = useTodayIso();

  const [editingTemplate, setEditingTemplate] = useState<Expense | null>(null);
  const [editInput, setEditInput] = useState<EditExpenseInput | null>(null);
  const [pendingAttachmentFile, setPendingAttachmentFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const activeTemplates = useMemo(
    () => listActiveRecurrenceTemplates(expenses, todayIso),
    [expenses, todayIso],
  );

  const resetEditSession = useCallback(() => {
    setEditingTemplate(null);
    setEditInput(null);
    setPendingAttachmentFile(null);
    setRemoveAttachment(false);
    setErrorKey(null);
  }, []);

  const openEdit = useCallback(
    (template: Expense) => {
      const display = resolveSettingsSeriesDisplayFields(template);
      setEditingTemplate(template);
      setEditInput({
        description: resolveBilingualText(display.description, locale),
        amount: String(display.amount),
        category: display.category,
        paymentMethod: display.paymentMethod,
        date: template.date,
      });
      setPendingAttachmentFile(null);
      setRemoveAttachment(false);
      setErrorKey(null);
    },
    [locale],
  );

  const closeEdit = useCallback(() => {
    resetEditSession();
  }, [resetEditSession]);

  const openDelete = useCallback((template: Expense) => {
    setDeleteTarget(template);
    setErrorKey(null);
  }, []);

  const dismissDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingTemplate || !editInput) return;

    const result = validateExpenseInput(editInput);
    if (!result.ok) {
      setErrorKey(result.error);
      return;
    }

    setIsSaving(true);
    setErrorKey(null);

    try {
      const currentDisplay = resolveSettingsSeriesDisplayFields(editingTemplate);
      const currentText = resolveBilingualText(currentDisplay.description, locale);
      const description =
        result.value.description === currentText
          ? currentDisplay.description
          : await createBilingualText(result.value.description, locale);

      const basicFields = {
        description,
        amount: result.value.amount,
        category: result.value.category,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
      };

      let nextExpenses = applyRecurringSettingsFieldUpdate(
        expenses,
        editingTemplate,
        basicFields,
        todayIso,
      );

      if (removeAttachment) {
        if (editingTemplate.attachmentUrl) {
          await deleteExpenseAttachment(userId, editingTemplate.id);
        }

        nextExpenses = nextExpenses.map((expense) => {
          if (expense.id !== editingTemplate.id || !expense.attachmentUrl) {
            return expense;
          }
          const { attachmentUrl, ...withoutAttachment } = expense;
          return withoutAttachment;
        });
      } else if (pendingAttachmentFile) {
        const attachmentUrl = await uploadExpenseAttachment(
          userId,
          editingTemplate.id,
          pendingAttachmentFile,
        );
        nextExpenses = nextExpenses.map((expense) =>
          expense.id === editingTemplate.id ? { ...expense, attachmentUrl } : expense,
        );
      }

      await applyExpenseBatch(userId, nextExpenses);
      await reload();
      resetEditSession();
    } catch (error) {
      if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
        setErrorKey('addExpense.attachmentTooLarge');
      } else if (error instanceof Error && error.message === 'translationError') {
        setErrorKey('translationError');
      } else {
        setErrorKey('profile.settings.recurring.saveError');
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    editInput,
    editingTemplate,
    expenses,
    locale,
    pendingAttachmentFile,
    reload,
    removeAttachment,
    resetEditSession,
    todayIso,
    userId,
  ]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsSaving(true);
    setErrorKey(null);

    try {
      const nextExpenses = terminateRecurrenceSeries(expenses, deleteTarget, todayIso);
      await applyExpenseBatch(userId, nextExpenses);
      await reload();
      setDeleteTarget(null);
    } catch {
      setErrorKey('profile.settings.recurring.saveError');
    } finally {
      setIsSaving(false);
    }
  }, [deleteTarget, expenses, reload, todayIso, userId]);

  return {
    activeTemplates,
    editingTemplate,
    editInput,
    pendingAttachmentFile,
    removeAttachment,
    deleteTarget,
    isSaving,
    errorKey,
    openEdit,
    closeEdit,
    openDelete,
    dismissDelete,
    saveEdit,
    confirmDelete,
    setEditInput,
    setPendingAttachmentFile,
    setRemoveAttachment,
  };
}
