import { useCallback, useMemo, useState } from 'react';
import { type Expense } from '../../../types/expense';
import { type AppLocale } from '../../../config/app';
import { validateExpenseInput, type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import {
  isScheduledOneTimeExpense,
  listScheduledOneTimeExpenses,
  shouldScheduleOneTimeExpense,
} from '../../../domain/expenses/scheduled';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { useTodayIso } from '../../../lib/hooks/useTodayIso';
import { applyExpenseBatch, deleteExpense } from '../../../services/expenses/expenseRepository';
import {
  deleteExpenseAttachment,
  uploadExpenseAttachment,
} from '../../../services/attachments/expenseAttachmentService';
import { createBilingualText } from '../../../services/translation/createBilingualText';

export interface UseScheduledOneTimeExpensesSettingsParams {
  userId: string | null;
  expenses: Expense[];
  reload: () => Promise<void>;
  locale: AppLocale;
}

export function useScheduledOneTimeExpensesSettings({
  userId,
  expenses,
  reload,
  locale,
}: UseScheduledOneTimeExpensesSettingsParams) {
  const todayIso = useTodayIso();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editInput, setEditInput] = useState<EditExpenseInput | null>(null);
  const [pendingAttachmentFile, setPendingAttachmentFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const scheduledExpenses = useMemo(
    () => listScheduledOneTimeExpenses(expenses),
    [expenses],
  );

  const resetEditSession = useCallback(() => {
    setEditingExpense(null);
    setEditInput(null);
    setPendingAttachmentFile(null);
    setRemoveAttachment(false);
    setErrorKey(null);
  }, []);

  const openEdit = useCallback(
    (expense: Expense) => {
      setEditingExpense(expense);
      setEditInput({
        description: resolveBilingualText(expense.description, locale),
        amount: String(expense.amount),
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        date: expense.date,
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

  const openDelete = useCallback((expense: Expense) => {
    setDeleteTarget(expense);
    setErrorKey(null);
  }, []);

  const dismissDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingExpense || !editInput) return;

    const result = validateExpenseInput(editInput, todayIso, { allowFutureDate: true });
    if (!result.ok) {
      setErrorKey(result.error);
      return;
    }

    setIsSaving(true);
    setErrorKey(null);

    try {
      const currentText = resolveBilingualText(editingExpense.description, locale);
      const description =
        result.value.description === currentText
          ? editingExpense.description
          : await createBilingualText(result.value.description, locale);

      const stillScheduled = shouldScheduleOneTimeExpense(
        { date: result.value.date, hasRecurrenceRule: false },
        todayIso,
      );

      let updated: Expense = {
        ...editingExpense,
        description,
        amount: result.value.amount,
        category: result.value.category,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
        date: result.value.date,
        ...(stillScheduled ? { scheduled: true } : {}),
      };

      if (!stillScheduled && isScheduledOneTimeExpense(updated)) {
        const { scheduled, ...materialized } = updated;
        updated = materialized;
      }

      if (removeAttachment) {
        if (editingExpense.attachmentUrl) {
          await deleteExpenseAttachment(userId, editingExpense.id);
        }
        const { attachmentUrl, ...withoutAttachment } = updated;
        updated = withoutAttachment;
      } else if (pendingAttachmentFile) {
        const attachmentUrl = await uploadExpenseAttachment(
          userId,
          editingExpense.id,
          pendingAttachmentFile,
        );
        updated = { ...updated, attachmentUrl };
      }

      const nextExpenses = expenses.map((expense) =>
        expense.id === editingExpense.id ? updated : expense,
      );

      await applyExpenseBatch(userId, nextExpenses);
      await reload();
      resetEditSession();
    } catch (error) {
      if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
        setErrorKey('addExpense.attachmentTooLarge');
      } else if (error instanceof Error && error.message === 'translationError') {
        setErrorKey('translationError');
      } else {
        setErrorKey('profile.settings.oneTime.saveError');
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    editInput,
    editingExpense,
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
      if (deleteTarget.attachmentUrl) {
        await deleteExpenseAttachment(userId, deleteTarget.id);
      }
      await deleteExpense(userId, deleteTarget.id);
      await reload();
      setDeleteTarget(null);
    } catch {
      setErrorKey('profile.settings.oneTime.saveError');
    } finally {
      setIsSaving(false);
    }
  }, [deleteTarget, reload, userId]);

  return {
    scheduledExpenses,
    editingExpense,
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
