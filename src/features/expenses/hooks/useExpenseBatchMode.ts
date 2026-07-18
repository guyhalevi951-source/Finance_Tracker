import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { validateExpenseInput, type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import { detachRecurringInstance } from '../../../domain/recurrence/detachRecurringInstance';
import {
  applyRecurringBasicFieldUpdate,
  type RecurrenceBasicFieldEditScope,
  type RecurringBasicFields,
} from '../../../domain/recurrence/applyRecurringBasicFieldUpdate';
import {
  applyRecurrenceDelete,
  type RecurrenceDeleteScope,
} from '../../../domain/recurrence/applyRecurrenceDelete';
import { isRecurringExpense } from '../../../domain/recurrence/isRecurringExpense';
import { requiresRecurringDeletePrompt } from '../../../domain/recurrence/requiresRecurringDeletePrompt';
import { sortExpensesByDateDescending } from '../../../domain/expenses/sortExpensesByDateDescending';
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

interface PendingRecurringEdit {
  target: Expense;
  basicFields: RecurringBasicFields;
  attachmentChange: PendingAttachmentChange;
}

export interface UseExpenseBatchModeReturn {
  mode: ExpenseBatchMode;
  displayExpenses: Expense[];
  draftExpenses: Expense[];
  selectedIds: Set<string>;
  showDiscardModal: boolean;
  editingExpense: Expense | null;
  isEditingRecurringExpense: boolean;
  editInput: EditExpenseInput | null;
  pendingAttachmentFile: File | null;
  removeAttachment: boolean;
  isSaving: boolean;
  editError: string | null;
  batchError: string | null;
  showRecurringDeleteModal: boolean;
  recurringDeleteTarget: Expense | null;
  pendingDeleteDraft: Expense[];
  recurringDeleteQueueIndex: number;
  recurringDeleteQueueTotal: number;
  showRecurringEditModal: boolean;
  showRecurringInstanceLinkModal: boolean;
  enterDeleteMode: () => void;
  enterEditMode: () => void;
  toggleSelected: (id: string) => void;
  openEditModal: (expense: Expense) => void;
  closeEditModal: () => void;
  setEditInput: (input: EditExpenseInput) => void;
  setPendingAttachmentFile: (file: File | null) => void;
  setRemoveAttachment: (remove: boolean) => void;
  saveLocalEdit: () => Promise<void>;
  confirmRecurringEdit: (scope: RecurrenceBasicFieldEditScope) => Promise<void>;
  dismissRecurringEdit: () => void;
  confirmInstanceOnlyEdit: (link: 'connected' | 'detached') => Promise<void>;
  dismissInstanceOnlyEdit: () => void;
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

export function useExpenseBatchMode(
  committedExpenses: Expense[],
  userId: string | null,
  onCommittedChange: () => Promise<void>,
  todayIso: string,
): UseExpenseBatchModeReturn {
  const { i18n } = useTranslation();
  const [mode, setMode] = useState<ExpenseBatchMode>('view');
  const [draftExpenses, setDraftExpenses] = useState<Expense[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editInput, setEditInput] = useState<EditExpenseInput | null>(null);
  const [pendingAttachmentFile, setPendingAttachmentFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [pendingAttachmentChanges, setPendingAttachmentChanges] = useState<
    Map<string, PendingAttachmentChange>
  >(new Map());
  const [pendingRecurringEdit, setPendingRecurringEdit] = useState<PendingRecurringEdit | null>(
    null,
  );
  const [pendingInstanceOnlyEdit, setPendingInstanceOnlyEdit] =
    useState<PendingRecurringEdit | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [showRecurringDeleteModal, setShowRecurringDeleteModal] = useState(false);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<Expense | null>(null);
  const [recurringDeleteQueue, setRecurringDeleteQueue] = useState<Expense[]>([]);
  const [recurringDeleteQueueTotal, setRecurringDeleteQueueTotal] = useState(0);
  const [pendingDeleteDraft, setPendingDeleteDraft] = useState<Expense[]>([]);
  const [deleteBaselineExpenses, setDeleteBaselineExpenses] = useState<Expense[]>([]);
  const [editBaselineExpenses, setEditBaselineExpenses] = useState<Expense[]>([]);

  const displayExpenses = mode === 'view' ? committedExpenses : draftExpenses;
  const isEditingRecurringExpense =
    editingExpense !== null && isRecurringExpense(editingExpense);
  const showRecurringEditModal = pendingRecurringEdit !== null;
  const showRecurringInstanceLinkModal = pendingInstanceOnlyEdit !== null;

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
    setPendingAttachmentFile(null);
    setRemoveAttachment(false);
    setPendingRecurringEdit(null);
    setPendingInstanceOnlyEdit(null);
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
    setEditBaselineExpenses(cloneExpenses(committedExpenses));
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
      setEditError(null);
    },
    [i18n.language],
  );

  const closeEditModal = useCallback(() => {
    resetEditSession();
  }, [resetEditSession]);

  const dismissRecurringEdit = useCallback(() => {
    resetEditSession();
    setIsSaving(false);
  }, [resetEditSession]);

  const applyEditToDraft = useCallback(
    (
      nextExpenses: Expense[],
      expenseId: string,
      attachmentChange: PendingAttachmentChange,
    ): Expense[] => {
      let updated = nextExpenses.find((expense) => expense.id === expenseId);
      if (!updated) return nextExpenses;

      if (attachmentChange.remove) {
        const { attachmentUrl, ...withoutAttachment } = updated;
        updated = withoutAttachment;
      }

      const result = nextExpenses.map((expense) =>
        expense.id === expenseId ? updated! : expense,
      );

      setPendingAttachmentChanges((prev) => {
        const next = new Map(prev);
        next.set(expenseId, attachmentChange);
        return next;
      });

      return result;
    },
    [],
  );

  const applyPendingRecurringEdit = useCallback(
    (
      edit: PendingRecurringEdit,
      scope: RecurrenceBasicFieldEditScope,
      detach: boolean,
    ): Expense[] => {
      const { target, basicFields, attachmentChange } = edit;
      // "This and future" must cascade starting at the selected instance itself, not today —
      // the UI promises "this and all future expenses" (RecurringEditConfirmModal).
      const splitDateIso = scope === 'thisAndFuture' ? target.date : todayIso;
      let nextExpenses = applyRecurringBasicFieldUpdate(
        draftExpenses,
        target,
        basicFields,
        scope,
        splitDateIso,
      );

      if (detach) {
        const updatedTarget = nextExpenses.find((expense) => expense.id === target.id) ?? target;
        nextExpenses = detachRecurringInstance(nextExpenses, updatedTarget);
      }

      return applyEditToDraft(nextExpenses, target.id, attachmentChange);
    },
    [applyEditToDraft, draftExpenses, todayIso],
  );

  const saveLocalEdit = useCallback(async () => {
    if (!editingExpense || !editInput) return;

    const result = validateExpenseInput(editInput);
    if (!result.ok) {
      setEditError(result.error);
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

      const basicFields: RecurringBasicFields = {
        description,
        amount: result.value.amount,
        category: result.value.category,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
      };

      const attachmentChange: PendingAttachmentChange = {
        remove: removeAttachment,
        file: pendingAttachmentFile,
      };

      if (isRecurringExpense(editingExpense)) {
        setPendingRecurringEdit({
          target: editingExpense,
          basicFields,
          attachmentChange,
        });
        setIsSaving(false);
        return;
      }

      let updated: Expense = {
        ...editingExpense,
        ...basicFields,
        date: result.value.date,
      };

      let nextExpenses = draftExpenses.map((expense) =>
        expense.id === updated.id ? updated : expense,
      );
      nextExpenses = applyEditToDraft(nextExpenses, editingExpense.id, attachmentChange);

      setDraftExpenses(nextExpenses);
      resetEditSession();
      setIsSaving(false);
    } catch {
      setEditError('translationError');
      setIsSaving(false);
    }
  }, [
    applyEditToDraft,
    draftExpenses,
    editInput,
    editingExpense,
    i18n.language,
    pendingAttachmentFile,
    removeAttachment,
    resetEditSession,
  ]);

  const resetToView = useCallback(() => {
    setMode('view');
    setDraftExpenses([]);
    setEditBaselineExpenses([]);
    setSelectedIds(new Set());
    setShowDiscardModal(false);
    setPendingAttachmentChanges(new Map());
    setBatchError(null);
    resetRecurringDeleteSession();
    resetEditSession();
  }, [resetEditSession, resetRecurringDeleteSession]);

  const persistBatch = useCallback(
    async (
      nextExpensesInput: Expense[],
      baselineExpenses: Expense[],
      options?: { allowEmpty?: boolean },
    ) => {
      setIsSaving(true);
      setBatchError(null);

      let nextExpenses = nextExpensesInput;

      // Guard against stale draft overwriting storage with an empty list after
      // expenses were created/reloaded while batch mode held an outdated snapshot.
      if (
        nextExpenses.length === 0 &&
        baselineExpenses.length > 0 &&
        options?.allowEmpty !== true
      ) {
        setBatchError('expense.batch.saveError');
        setIsSaving(false);
        return false;
      }

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

  const persistRecurringEdit = useCallback(
    async (nextExpenses: Expense[]) => {
      const baseline =
        editBaselineExpenses.length > 0 ? editBaselineExpenses : committedExpenses;
      setDraftExpenses(nextExpenses);
      return persistBatch(nextExpenses, baseline);
    },
    [committedExpenses, editBaselineExpenses, persistBatch],
  );

  const confirmRecurringEdit = useCallback(
    async (scope: RecurrenceBasicFieldEditScope) => {
      if (!pendingRecurringEdit) return;

      if (scope === 'instanceOnly') {
        setPendingInstanceOnlyEdit(pendingRecurringEdit);
        setPendingRecurringEdit(null);
        setIsSaving(false);
        return;
      }

      setIsSaving(true);
      setEditError(null);

      try {
        const nextExpenses = applyPendingRecurringEdit(pendingRecurringEdit, scope, false);
        const ok = await persistRecurringEdit(nextExpenses);
        if (!ok) {
          setEditError('expense.batch.saveError');
          return;
        }
        resetEditSession();
      } catch {
        setEditError('translationError');
      } finally {
        setIsSaving(false);
      }
    },
    [applyPendingRecurringEdit, pendingRecurringEdit, persistRecurringEdit, resetEditSession],
  );

  const confirmInstanceOnlyEdit = useCallback(
    async (link: 'connected' | 'detached') => {
      if (!pendingInstanceOnlyEdit) return;

      setIsSaving(true);
      setEditError(null);

      try {
        const nextExpenses = applyPendingRecurringEdit(
          pendingInstanceOnlyEdit,
          'instanceOnly',
          link === 'detached',
        );
        const ok = await persistRecurringEdit(nextExpenses);
        if (!ok) {
          setEditError('expense.batch.saveError');
          return;
        }
        resetEditSession();
      } catch {
        setEditError('translationError');
      } finally {
        setIsSaving(false);
      }
    },
    [applyPendingRecurringEdit, pendingInstanceOnlyEdit, persistRecurringEdit, resetEditSession],
  );

  const dismissInstanceOnlyEdit = useCallback(() => {
    setPendingInstanceOnlyEdit(null);
    setIsSaving(false);
  }, []);

  const confirmMode = useCallback(async () => {
    if (mode === 'deleting') {
      const selectedExpenses = sortExpensesByDateDescending(
        draftExpenses.filter((expense) => selectedIds.has(expense.id)),
      );

      const recurringWithFuture = selectedExpenses.filter(
        (expense) =>
          isRecurringExpense(expense) &&
          requiresRecurringDeletePrompt(draftExpenses, expense, todayIso),
      );
      const recurringLastOnly = selectedExpenses.filter(
        (expense) =>
          isRecurringExpense(expense) &&
          !requiresRecurringDeletePrompt(draftExpenses, expense, todayIso),
      );
      const nonRecurring = selectedExpenses.filter((expense) => !isRecurringExpense(expense));

      let workingDraft = draftExpenses;

      for (const expense of recurringLastOnly) {
        const target = workingDraft.find((item) => item.id === expense.id) ?? expense;
        workingDraft = applyRecurrenceDelete(workingDraft, target, 'instanceOnly');
      }

      const nonRecurringIds = new Set(nonRecurring.map((expense) => expense.id));
      workingDraft = workingDraft.filter((expense) => !nonRecurringIds.has(expense.id));

      if (recurringWithFuture.length > 0) {
        setDeleteBaselineExpenses(draftExpenses);
        setPendingDeleteDraft(workingDraft);
        setDraftExpenses(workingDraft);
        setSelectedIds(new Set(recurringWithFuture.map((expense) => expense.id)));
        setRecurringDeleteQueue(recurringWithFuture);
        setRecurringDeleteQueueTotal(recurringWithFuture.length);
        setRecurringDeleteTarget(recurringWithFuture[0]);
        setShowRecurringDeleteModal(true);
        return;
      }

      const ok = await persistBatch(workingDraft, draftExpenses, {
        allowEmpty: selectedExpenses.length === draftExpenses.length,
      });
      if (ok) {
        setDraftExpenses([]);
        setSelectedIds(new Set());
      }
      return;
    }

    // Edit mode must never wipe storage via a stale empty draft.
    await persistBatch(draftExpenses, editBaselineExpenses.length > 0 ? editBaselineExpenses : draftExpenses);
  }, [draftExpenses, editBaselineExpenses, mode, persistBatch, selectedIds, todayIso]);

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

      const ok = await persistBatch(nextDraft, deleteBaselineExpenses, {
        allowEmpty: nextDraft.length === 0,
      });
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
    isEditingRecurringExpense,
    editInput,
    pendingAttachmentFile,
    removeAttachment,
    isSaving,
    editError,
    batchError,
    showRecurringDeleteModal,
    recurringDeleteTarget,
    pendingDeleteDraft,
    recurringDeleteQueueIndex:
      recurringDeleteQueueTotal > 0
        ? recurringDeleteQueueTotal - recurringDeleteQueue.length + 1
        : 0,
    recurringDeleteQueueTotal,
    showRecurringEditModal,
    showRecurringInstanceLinkModal,
    enterDeleteMode,
    enterEditMode,
    toggleSelected,
    openEditModal,
    closeEditModal,
    setEditInput,
    setPendingAttachmentFile,
    setRemoveAttachment,
    saveLocalEdit,
    confirmRecurringEdit,
    dismissRecurringEdit,
    confirmInstanceOnlyEdit,
    dismissInstanceOnlyEdit,
    confirmMode,
    confirmRecurringDelete,
    dismissRecurringDelete,
    requestCancel,
    confirmDiscard,
    dismissDiscard,
  };
}
