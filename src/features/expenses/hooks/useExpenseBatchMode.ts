import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import {
  DEFAULT_RECURRENCE_SELECTION,
  type RecurrenceSelection,
} from '../../../types/recurrenceRule';
import { validateExpenseInput, type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import { applyRecurrenceChangeOnEdit } from '../../../domain/recurrence/applyRecurrenceChangeOnEdit';
import {
  applyRecurrenceDelete,
  type RecurrenceDeleteScope,
} from '../../../domain/recurrence/applyRecurrenceDelete';
import { isRecurringExpense } from '../../../domain/recurrence/isRecurringExpense';
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
  showRecurringDeleteModal: boolean;
  recurringDeleteTarget: Expense | null;
  recurringDeleteQueueIndex: number;
  recurringDeleteQueueTotal: number;
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
  confirmRecurringDelete: (scope: RecurrenceDeleteScope) => Promise<void>;
  dismissRecurringDelete: () => void;
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
  const [showRecurringDeleteModal, setShowRecurringDeleteModal] = useState(false);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<Expense | null>(null);
  const [recurringDeleteQueue, setRecurringDeleteQueue] = useState<Expense[]>([]);
  const [recurringDeleteQueueTotal, setRecurringDeleteQueueTotal] = useState(0);
  const [pendingDeleteDraft, setPendingDeleteDraft] = useState<Expense[]>([]);
  const [deleteBaselineExpenses, setDeleteBaselineExpenses] = useState<Expense[]>([]);

  const displayExpenses = mode === 'view' ? committedExpenses : draftExpenses;

  const resetRecurringDeleteSession = useCallback(() => {
    setShowRecurringDeleteModal(false);
    setRecurringDeleteTarget(null);
    setRecurringDeleteQueue([]);
    setRecurringDeleteQueueTotal(0);
    setPendingDeleteDraft([]);
    setDeleteBaselineExpenses([]);
  }, []);

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

  const resetToView = useCallback(() => {
    setMode('view');
    setDraftExpenses([]);
    setSelectedIds(new Set());
    setShowDiscardModal(false);
    setPendingAttachmentChanges(new Map());
    setBatchError(null);
    resetRecurringDeleteSession();
    resetEditSession();
  }, [resetEditSession, resetRecurringDeleteSession]);

  const persistBatch = useCallback(
    async (nextExpensesInput: Expense[], baselineExpenses: Expense[]) => {
      setIsSaving(true);
      setBatchError(null);

      let nextExpenses = nextExpensesInput;

      const removedIds = new Set(
        baselineExpenses
          .filter((expense) => !nextExpenses.some((item) => item.id === expense.id))
          .map((expense) => expense.id),
      );

      try {
        for (const expenseId of removedIds) {
          await deleteExpenseAttachment(userId, expenseId);
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
      } catch (error) {
        if (error instanceof Error && error.message === 'FILE_TOO_LARGE') {
          setBatchError('addExpense.attachmentTooLarge');
        } else {
          setBatchError('addExpense.attachmentError');
        }
        setIsSaving(false);
        return false;
      }

      try {
        await applyExpenseBatch(userId, nextExpenses);
        await onCommittedChange();
        resetToView();
        return true;
      } catch {
        setBatchError('expense.batch.saveError');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [onCommittedChange, pendingAttachmentChanges, resetToView, userId],
  );

  const confirmMode = useCallback(async () => {
    if (mode === 'deleting') {
      const selectedExpenses = draftExpenses.filter((expense) => selectedIds.has(expense.id));
      const recurring = selectedExpenses.filter(isRecurringExpense);
      const oneOffIds = new Set(
        selectedExpenses.filter((expense) => !isRecurringExpense(expense)).map((expense) => expense.id),
      );

      const afterOneOffDelete = draftExpenses.filter((expense) => !oneOffIds.has(expense.id));

      if (recurring.length > 0) {
        setDeleteBaselineExpenses(draftExpenses);
        setPendingDeleteDraft(afterOneOffDelete);
        setDraftExpenses(afterOneOffDelete);
        setSelectedIds(new Set(recurring.map((expense) => expense.id)));
        setRecurringDeleteQueue(recurring);
        setRecurringDeleteQueueTotal(recurring.length);
        setRecurringDeleteTarget(recurring[0]);
        setShowRecurringDeleteModal(true);
        return;
      }

      const ok = await persistBatch(afterOneOffDelete, draftExpenses);
      if (ok) {
        setDraftExpenses([]);
        setSelectedIds(new Set());
      }
      return;
    }

    await persistBatch(draftExpenses, draftExpenses);
  }, [draftExpenses, mode, persistBatch, selectedIds]);

  const confirmRecurringDelete = useCallback(
    async (scope: RecurrenceDeleteScope) => {
      if (!recurringDeleteTarget) return;

      const targetInDraft =
        pendingDeleteDraft.find((expense) => expense.id === recurringDeleteTarget.id) ??
        recurringDeleteTarget;

      let nextDraft = applyRecurrenceDelete(pendingDeleteDraft, targetInDraft, scope);
      const remainingQueue = recurringDeleteQueue.slice(1);

      if (remainingQueue.length > 0) {
        setPendingDeleteDraft(nextDraft);
        setRecurringDeleteQueue(remainingQueue);
        setRecurringDeleteTarget(remainingQueue[0]);
        return;
      }

      setShowRecurringDeleteModal(false);
      setRecurringDeleteTarget(null);
      setRecurringDeleteQueue([]);

      const ok = await persistBatch(nextDraft, deleteBaselineExpenses);
      if (ok) {
        resetRecurringDeleteSession();
      }
    },
    [
      deleteBaselineExpenses,
      pendingDeleteDraft,
      persistBatch,
      recurringDeleteQueue,
      recurringDeleteTarget,
      resetRecurringDeleteSession,
    ],
  );

  const dismissRecurringDelete = useCallback(() => {
    resetRecurringDeleteSession();
  }, [resetRecurringDeleteSession]);

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
    showRecurringDeleteModal,
    recurringDeleteTarget,
    recurringDeleteQueueIndex:
      recurringDeleteQueueTotal > 0
        ? recurringDeleteQueueTotal - recurringDeleteQueue.length + 1
        : 0,
    recurringDeleteQueueTotal,
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
    confirmRecurringDelete,
    dismissRecurringDelete,
    requestCancel,
    confirmDiscard,
    dismissDiscard,
  };
}
