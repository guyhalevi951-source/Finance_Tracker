import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { validateExpenseInput, type EditExpenseInput } from '../../../domain/expenses/validateExpense';
import { applyExpenseBatch } from '../../../services/expenses/expenseRepository';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { resolveBilingualText } from '../../../domain/i18n/resolveBilingualText';
import { type AppLocale } from '../../../config/app';

export type ExpenseBatchMode = 'view' | 'deleting' | 'editing';

export interface UseExpenseBatchModeReturn {
  mode: ExpenseBatchMode;
  displayExpenses: Expense[];
  draftExpenses: Expense[];
  selectedIds: Set<string>;
  showDiscardModal: boolean;
  editingExpense: Expense | null;
  editInput: EditExpenseInput | null;
  isSaving: boolean;
  editError: string | null;
  enterDeleteMode: () => void;
  enterEditMode: () => void;
  toggleSelected: (id: string) => void;
  openEditModal: (expense: Expense) => void;
  closeEditModal: () => void;
  setEditInput: (input: EditExpenseInput) => void;
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
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const displayExpenses = mode === 'view' ? committedExpenses : draftExpenses;

  const enterDeleteMode = useCallback(() => {
    setMode('deleting');
    setDraftExpenses(cloneExpenses(committedExpenses));
    setSelectedIds(new Set());
    setShowDiscardModal(false);
  }, [committedExpenses]);

  const enterEditMode = useCallback(() => {
    setMode('editing');
    setDraftExpenses(cloneExpenses(committedExpenses));
    setSelectedIds(new Set());
    setShowDiscardModal(false);
  }, [committedExpenses]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openEditModal = useCallback((expense: Expense) => {
    const locale = i18n.language as AppLocale;
    setEditingExpense(expense);
    setEditInput({
      description: resolveBilingualText(expense.description, locale),
      amount: String(expense.amount),
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      date: expense.date,
    });
    setEditError(null);
  }, [i18n.language]);

  const closeEditModal = useCallback(() => {
    setEditingExpense(null);
    setEditInput(null);
    setEditError(null);
  }, []);

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

      const updated: Expense = {
        ...editingExpense,
        description,
        amount: result.value.amount,
        category: result.value.category,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
        date: result.value.date,
      };

      setDraftExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      closeEditModal();
    } catch {
      setEditError('translationError');
    } finally {
      setIsSaving(false);
    }
  }, [editingExpense, editInput, i18n.language, closeEditModal]);

  const confirmMode = useCallback(async () => {
    setIsSaving(true);
    try {
      let nextExpenses = draftExpenses;
      if (mode === 'deleting') {
        nextExpenses = draftExpenses.filter((e) => !selectedIds.has(e.id));
      }
      await applyExpenseBatch(userId, nextExpenses);
      await onCommittedChange();
      setMode('view');
      setDraftExpenses([]);
      setSelectedIds(new Set());
      setShowDiscardModal(false);
      closeEditModal();
    } finally {
      setIsSaving(false);
    }
  }, [draftExpenses, mode, selectedIds, userId, onCommittedChange, closeEditModal]);

  const resetToView = useCallback(() => {
    setMode('view');
    setDraftExpenses([]);
    setSelectedIds(new Set());
    setShowDiscardModal(false);
    closeEditModal();
  }, [closeEditModal]);

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
    isSaving,
    editError,
    enterDeleteMode,
    enterEditMode,
    toggleSelected,
    openEditModal,
    closeEditModal,
    setEditInput,
    saveLocalEdit,
    confirmMode,
    requestCancel,
    confirmDiscard,
    dismissDiscard,
  };
}
