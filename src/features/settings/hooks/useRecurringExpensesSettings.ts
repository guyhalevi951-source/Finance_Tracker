import { useCallback, useMemo, useState } from 'react';
import { type Expense } from '../../../types/expense';
import {
  DEFAULT_RECURRENCE_SELECTION,
  type RecurrenceRule,
  type RecurrenceSelection,
} from '../../../types/recurrenceRule';
import { type AppLocale } from '../../../config/app';
import { validateExpenseInput, type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import { applyRecurrenceSeriesSettingsEdit } from '../../../domain/recurrence/applyRecurrenceSeriesSettingsEdit';
import { countSeriesOccurrences } from '../../../domain/recurrence/countSeriesOccurrences';
import { listActiveRecurrenceTemplates } from '../../../domain/recurrence/listActiveRecurrenceTemplates';
import {
  remainingOccurrencesToRuleLimit,
  ruleLimitToRemainingSelection,
} from '../../../domain/recurrence/occurrencesRemaining';
import { ruleToSelection, selectionToRule } from '../../../domain/recurrence/presets';
import { terminateRecurrenceSeries } from '../../../domain/recurrence/terminateRecurrenceSeries';
import { validateRecurrenceSelection } from '../../../domain/recurrence/validateRecurrenceRule';
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

function selectionToRuleWithRemaining(
  selection: RecurrenceSelection,
  currentCount: number,
): RecurrenceRule | null {
  const baseRule = selectionToRule(selection);
  if (!baseRule) return null;

  const limit = selection.occurrencesLimit ?? 'unlimited';
  if (limit === 'unlimited') {
    return { ...baseRule, occurrences: null };
  }

  if (limit === 'custom') {
    const remaining = selection.customOccurrences ?? 0;
    return {
      ...baseRule,
      occurrences: remainingOccurrencesToRuleLimit(remaining, currentCount),
    };
  }

  const remaining = Number.parseInt(limit, 10);
  return {
    ...baseRule,
    occurrences: remainingOccurrencesToRuleLimit(remaining, currentCount),
  };
}

function buildRecurrenceSelectionForTemplate(
  template: Expense,
  expenses: Expense[],
): RecurrenceSelection {
  if (!template.recurrenceRule) {
    return DEFAULT_RECURRENCE_SELECTION;
  }

  const base = ruleToSelection(template.recurrenceRule);
  const remainingFields = ruleLimitToRemainingSelection(
    template.recurrenceRule,
    countSeriesOccurrences(expenses, template.id),
  );

  return { ...base, ...remainingFields };
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
  const [editRecurrenceSelection, setEditRecurrenceSelection] =
    useState<RecurrenceSelection>(DEFAULT_RECURRENCE_SELECTION);
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
    setEditRecurrenceSelection(DEFAULT_RECURRENCE_SELECTION);
    setPendingAttachmentFile(null);
    setRemoveAttachment(false);
    setErrorKey(null);
  }, []);

  const openEdit = useCallback(
    (template: Expense) => {
      setEditingTemplate(template);
      setEditInput({
        description: resolveBilingualText(template.description, locale),
        amount: String(template.amount),
        category: template.category,
        paymentMethod: template.paymentMethod,
        date: template.date,
      });
      setEditRecurrenceSelection(buildRecurrenceSelectionForTemplate(template, expenses));
      setPendingAttachmentFile(null);
      setRemoveAttachment(false);
      setErrorKey(null);
    },
    [expenses, locale],
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

    const recurrenceError = validateRecurrenceSelection(editRecurrenceSelection);
    const limit = editRecurrenceSelection.occurrencesLimit ?? 'unlimited';
    const isZeroRemaining =
      limit === 'custom' && (editRecurrenceSelection.customOccurrences ?? 0) === 0;

    if (recurrenceError && !isZeroRemaining) {
      setErrorKey(recurrenceError);
      return;
    }

    setIsSaving(true);
    setErrorKey(null);

    try {
      const currentText = resolveBilingualText(editingTemplate.description, locale);
      const description =
        result.value.description === currentText
          ? editingTemplate.description
          : await createBilingualText(result.value.description, locale);

      let updated: Expense = {
        ...editingTemplate,
        description,
        amount: result.value.amount,
        category: result.value.category,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
        date: editingTemplate.date,
      };

      const currentCount = countSeriesOccurrences(expenses, editingTemplate.id);
      const newRule = selectionToRule(editRecurrenceSelection);
      const customRemaining = editRecurrenceSelection.customOccurrences ?? 0;
      const shouldTerminate =
        newRule === null ||
        (limit === 'custom' && customRemaining === 0);

      let nextExpenses: Expense[];
      let targetId = editingTemplate.id;

      if (shouldTerminate) {
        nextExpenses = terminateRecurrenceSeries(expenses, editingTemplate, todayIso);
        nextExpenses = nextExpenses.map((expense) =>
          expense.id === editingTemplate.id ? { ...expense, ...updated } : expense,
        );
      } else {
        const resolvedRule = selectionToRuleWithRemaining(editRecurrenceSelection, currentCount);
        nextExpenses = applyRecurrenceSeriesSettingsEdit(
          expenses,
          editingTemplate,
          updated,
          resolvedRule,
          todayIso,
        );

        const newTemplate = nextExpenses.find(
          (expense) =>
            expense.id !== editingTemplate.id &&
            expense.date === todayIso &&
            expense.recurrenceRule !== undefined,
        );
        if (newTemplate) {
          targetId = newTemplate.id;
        }
      }

      if (removeAttachment) {
        await deleteExpenseAttachment(userId, targetId);
        const { attachmentUrl, ...withoutAttachment } = updated;
        updated = withoutAttachment;
        nextExpenses = nextExpenses.map((expense) =>
          expense.id === targetId ? { ...expense, ...withoutAttachment } : expense,
        );
      } else if (pendingAttachmentFile) {
        const attachmentUrl = await uploadExpenseAttachment(
          userId,
          targetId,
          pendingAttachmentFile,
        );
        nextExpenses = nextExpenses.map((expense) =>
          expense.id === targetId ? { ...expense, attachmentUrl } : expense,
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
    editRecurrenceSelection,
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
    editRecurrenceSelection,
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
    setEditRecurrenceSelection,
    setPendingAttachmentFile,
    setRemoveAttachment,
  };
}
