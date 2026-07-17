import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import {
  DEFAULT_RECURRENCE_SELECTION,
  type RecurrenceSelection,
} from '../../../types/recurrenceRule';
import { validateExpenseInput, type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import { applyRecurrenceChangeOnEdit } from '../../../domain/recurrence/applyRecurrenceChangeOnEdit';
import { ruleToSelection, selectionToRule } from '../../../domain/recurrence/presets';
import { validateRecurrenceSelection } from '../../../domain/recurrence/validateRecurrenceRule';
import { applyExpenseBatch } from '../../../services/expenses/expenseRepository';
import {
  deleteExpenseAttachment,
  uploadExpenseAttachment,
} from '../../../services/attachments/expenseAttachmentService';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { type AppLocale } from '../../../config/app';

export type ExpenseBatchMode = 'view' | 'deleting' | 'editing';

type PendingAttachmentChange = {
  remove: boolean;
  file: File | null;
};

export interface UseExpenseBatchModeReturn {
  mode: ExpenseBatchMode;
  displayExpenses: Expense[];
  draftExpenses: Expense[];
  selectedIds: Set<string>;
  showDiscardModal: boolean;
  editingExpense: Expense | null;
  editInput: EditExpenseInput | null;
  editRecurrenceSelection: RecurrenceSelection;
  pendingAttachmentFile: File | null;
  removeAttachment: boolean;
  isSaving: boolean;
  editError: string | null;
  batchError: string | null;
  enterDeleteMode: () => void;
  enterEditMode: () => void;
  toggleSelected: (id: string) => void;
  openEditModal: (expense: Expense) => void;
  closeEditModal: () => void;
  setEditInput: (input: EditExpenseInput) => void;
  setEditRecurrenceSelection: (selection: RecurrenceSelection) => void;
  setPendingAttachmentFile: (file: File | null) => void;
  setRemoveAttachment: (remove: boolean) => void;
  saveLocalEdit: () => Promise<void>;
  confirmMode: () => Promise<void>;
  requestCancel: () => void;
  confirmDiscard: () => void;
  dismissDiscard: () => void;
}

function cloneExpenses(expenses: Expense[]): Expense[] {
  return expenses.map((e) => ({
    ...e,
    description: { ...e.description },
  }));
}

function resolveRecurrenceSelectionForExpense(
  expense: Expense,
  expenses: Expense[],
): RecurrenceSelection {
  if (expense.recurrenceRule) {
    return ruleToSelection(expense.recurrenceRule);
  }

  if (expense.recurrenceSeriesId) {
    const template = expenses.find((item) => item.id === expense.recurrenceSeriesId);
    if (template?.recurrenceRule) {
      return ruleToSelection(template.recurrenceRule);
    }
  }

  return DEFAULT_RECURRENCE_SELECTION;
}

export function useExpenseBatchMode(
  committedExpenses: Expense[],
  userId: string | null,
  onCommittedChange: () => Promise<void>,
): UseExpenseBatchModeReturn {
  const { i18n } = useTranslation();
  const [mode, setMode] = useState<ExpenseBatchMode>('view');
  const [draftExpenses, setDraftExpenses] = useState<Expense[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editInput, setEditInput] = useState<EditExpenseInput | null>(null);
  const [editRecurrenceSelection, setEditRecurrenceSelection] =
    useState<RecurrenceSelection>(DEFAULT_RECURRENCE_SELECTION);
  const [pendingAttachmentFile, setPendingAttachmentFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [pendingAttachmentChanges, setPendingAttachmentChanges] = useState<
    Map<string, PendingAttachmentChange>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const displayExpenses = mode === 'view' ? committedExpenses : draftExpenses;

  const resetEditSession = useCallback(() => {
    setEditingExpense(null);
    setEditInput(null);
    setEditRecurrenceSelection(DEFAULT_RECURRENCE_SELECTION);
    setPendingAttachmentFile(null);
    setRemoveAttachment(false);
    setEditError(null);
  }, []);

  const enterDeleteMode = useCallback(() => {
    setMode('deleting');
    setDraftExpenses(cloneExpenses(committedExpenses));
    setSelectedIds(new Set());
    setShowDiscardModal(false);
    setPendingAttachmentChanges(new Map());
    setBatchError(null);
  }, [committedExpenses]);

  const enterEditMode = useCallback(() => {
    setMode('editing');
    setDraftExpenses(cloneExpenses(committedExpenses));
    setSelectedIds(new Set());
    setShowDiscardModal(false);
    setPendingAttachmentChanges(new Map());
    setBatchError(null);
  }, [committedExpenses]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openEditModal = useCallback(
    (expense: Expense) => {
      const locale = i18n.language as AppLocale;
      const sourceExpenses = mode === 'view' ? committedExpenses : draftExpenses;
      setEditingExpense(expense);
      setEditInput({
        description: resolveBilingualText(expense.description, locale),
        amount: String(expense.amount),
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        date: expense.date,
      });
      setEditRecurrenceSelection(resolveRecurrenceSelectionForExpense(expense, sourceExpenses));
      setPendingAttachmentFile(null);
      setRemoveAttachment(false);
      setEditError(null);
    },
    [committedExpenses, draftExpenses, i18n.language, mode],
  );

  const closeEditModal = useCallback(() => {
    resetEditSession();
  }, [resetEditSession]);

  const saveLocalEdit = useCallback(async () => {
    if (!editingExpense || !editInput) return;

    const result = validateExpenseInput(editInput);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    const recurrenceError = validateRecurrenceSelection(editRecurrenceSelection);
    if (recurrenceError) {
      setEditError(recurrenceError);
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const locale = i18n.language as AppLocale;
      const currentText = resolveBilingualText(editingExpense.description, locale);
      const description =
        result.value.description === currentText
          ? editingExpense.description
          : await createBilingualText(result.value.description, locale);

      let updated: Expense = {
        ...editingExpense,
        description,
        amount: result.value.amount,
        category: result.value.category,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
        date: result.value.date,
      };

      const newRule = selectionToRule(editRecurrenceSelection);
      let nextExpenses = draftExpenses.map((expense) =>
        expense.id === updated.id ? updated : expense,
      );
      nextExpenses = applyRecurrenceChangeOnEdit(nextExpenses, updated, newRule);
      updated = nextExpenses.find((expense) => expense.id === editingExpense.id) ?? updated;

      const pendingChange: PendingAttachmentChange = {
        remove: removeAttachment,
        file: pendingAttachmentFile,
      };

      setPendingAttachmentChanges((prev) => {
        const next = new Map(prev);
        next.set(editingExpense.id, pendingChange);
        return next;
      });

      if (removeAttachment) {
        const { attachmentUrl, ...withoutAttachment } = updated;
        updated = withoutAttachment;
      }

      nextExpenses = nextExpenses.map((expense) =>
        expense.id === updated.id ? updated : expense,
      );

      setDraftExpenses(nextExpenses);
      resetEditSession();
    } catch {
      setEditError('translationError');
    } finally {
      setIsSaving(false);
    }
  }, [
    draftExpenses,
    editInput,
    editRecurrenceSelection,
    editingExpense,
    i18n.language,
    pendingAttachmentFile,
    removeAttachment,
    resetEditSession,
  ]);

  const confirmMode = useCallback(async () => {
    setIsSaving(true);
    setBatchError(null);

    try {
      let nextExpenses = draftExpenses;
      if (mode === 'deleting') {
        nextExpenses = draftExpenses.filter((expense) => !selectedIds.has(expense.id));
      }

      for (const [expenseId, change] of pendingAttachmentChanges.entries()) {
        const index = nextExpenses.findIndex((expense) => expense.id === expenseId);
        if (index === -1) continue;

        const expense = nextExpenses[index];

        if (change.remove) {
          await deleteExpenseAttachment(userId, expenseId);
          const { attachmentUrl, ...withoutAttachment } = expense;
          nextExpenses = nextExpenses.map((item, itemIndex) =>
            itemIndex === index ? withoutAttachment : item,
          );
          continue;
        }

        if (change.file) {
          const attachmentUrl = await uploadExpenseAttachment(userId, expenseId, change.file);
          nextExpenses = nextExpenses.map((item, itemIndex) =>
            itemIndex === index ? { ...item, attachmentUrl } : item,
          );
        }
      }

      await applyExpenseBatch(userId, nextExpenses);
      await onCommittedChange();
      setMode('view');
      setDraftExpenses([]);
      setSelectedIds(new Set());
      setShowDiscardModal(false);
      setPendingAttachmentChanges(new Map());
      resetEditSession();
    } catch (error) {
      if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
        setBatchError('addExpense.attachmentTooLarge');
      } else {
        setBatchError('addExpense.attachmentError');
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    draftExpenses,
    mode,
    onCommittedChange,
    pendingAttachmentChanges,
    resetEditSession,
    selectedIds,
    userId,
  ]);

  const resetToView = useCallback(() => {
    setMode('view');
    setDraftExpenses([]);
    setSelectedIds(new Set());
    setShowDiscardModal(false);
    setPendingAttachmentChanges(new Map());
    setBatchError(null);
    resetEditSession();
  }, [resetEditSession]);

  const requestCancel = useCallback(() => {
    setShowDiscardModal(true);
  }, []);

  const confirmDiscard = useCallback(() => {
    resetToView();
  }, [resetToView]);

  const dismissDiscard = useCallback(() => {
    setShowDiscardModal(false);
  }, []);

  return {
    mode,
    displayExpenses,
    draftExpenses,
    selectedIds,
    showDiscardModal,
    editingExpense,
    editInput,
    editRecurrenceSelection,
    pendingAttachmentFile,
    removeAttachment,
    isSaving,
    editError,
    batchError,
    enterDeleteMode,
    enterEditMode,
    toggleSelected,
    openEditModal,
    closeEditModal,
    setEditInput,
    setEditRecurrenceSelection,
    setPendingAttachmentFile,
    setRemoveAttachment,
    saveLocalEdit,
    confirmMode,
    requestCancel,
    confirmDiscard,
    dismissDiscard,
  };
}
