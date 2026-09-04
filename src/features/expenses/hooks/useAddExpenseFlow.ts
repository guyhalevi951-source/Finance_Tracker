import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { validateExpenseInput } from '../../../domain/expenses/validateExpense';
import { shouldScheduleOneTimeExpense } from '../../../domain/expenses/scheduled';
import { generateExpenseId } from '../../../domain/expenses/generateId';
import {
  DEFAULT_PAYMENT_METHOD,
  type PaymentMethodId,
} from '../../../domain/expenses/paymentMethods';
import {
  DEFAULT_RECURRENCE_SELECTION,
  type RecurrenceSelection,
} from '../../../types/recurrenceRule';
import { selectionToRule } from '../../../domain/recurrence/presets';
import { validateRecurrenceSelection } from '../../../domain/recurrence/validateRecurrenceRule';
import { isDateWithinSubBudget } from '../../../domain/budget/validateSubBudget';
import { finalizeRecurrenceSchedule } from '../../../domain/recurrence/finalizeRecurrenceSchedule';
import { exceedsSubBudgetOccurrenceCap } from '../../../domain/recurrence/subBudgetRecurrenceOccurrenceCap';
import { toIsoDate } from '../../../domain/expenses/parseExpenseDate';
import { useTodayIso } from '../../../lib/hooks/useTodayIso';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { uploadExpenseAttachment } from '../../../services/attachments/expenseAttachmentService';
import { type AppLocale } from '../../../config/app';

export type AddExpenseStep = 'category' | 'entry';

export interface UseAddExpenseFlowOptions {
  userId: string | null;
  createExpense: (expense: Expense) => Promise<void>;
  activeBudgetId: string;
  isMaster: boolean;
  subBudgetWindow?: { startDate: string; endDate: string } | null;
}

export function useAddExpenseFlow({
  userId,
  createExpense,
  activeBudgetId,
  isMaster,
  subBudgetWindow,
}: UseAddExpenseFlowOptions) {
  const { i18n } = useTranslation();
  const todayIso = useTodayIso();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<AddExpenseStep>('category');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [amountDigits, setAmountDigits] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(DEFAULT_PAYMENT_METHOD);
  const [recurrenceSelection, setRecurrenceSelection] = useState<RecurrenceSelection>(
    DEFAULT_RECURRENCE_SELECTION,
  );
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('category');
    setSelectedSubCategoryId(null);
    setAmountDigits('');
    setNote('');
    setDate(toIsoDate(new Date()));
    setPaymentMethod(DEFAULT_PAYMENT_METHOD);
    setRecurrenceSelection(DEFAULT_RECURRENCE_SELECTION);
    setAttachmentFile(null);
    setIsSaving(false);
    setErrorKey(null);
  }, []);

  const openFlow = useCallback(() => {
    reset();
    setOpen(true);
  }, [reset]);

  const closeFlow = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const selectSubCategory = useCallback((subId: string) => {
    setSelectedSubCategoryId(subId);
    setStep('entry');
    setErrorKey(null);
  }, []);

  const goBackToCategories = useCallback(() => {
    setStep('category');
    setErrorKey(null);
  }, []);

  const submit = useCallback(async () => {
    if (!selectedSubCategoryId) return;

    const locale = i18n.language as AppLocale;
    const description = note.trim();

    const result = validateExpenseInput(
      {
        description,
        amount: amountDigits === '' ? '0' : amountDigits,
        category: selectedSubCategoryId,
        paymentMethod,
        date,
      },
      todayIso,
      { allowFutureDate: true },
    );

    if (!result.ok) {
      setErrorKey(`expense.validation.${result.error}`);
      return;
    }

    const recurrenceError = validateRecurrenceSelection(recurrenceSelection);
    if (recurrenceError) {
      setErrorKey(`addExpense.validation.${recurrenceError}`);
      return;
    }

    if (
      !isMaster &&
      subBudgetWindow &&
      !isDateWithinSubBudget(result.value.date, subBudgetWindow.startDate, subBudgetWindow.endDate)
    ) {
      setErrorKey('budget.validation.DATE_OUT_OF_WINDOW');
      return;
    }

    const recurrenceRule = selectionToRule(recurrenceSelection);

    if (
      !isMaster &&
      subBudgetWindow &&
      recurrenceRule &&
      exceedsSubBudgetOccurrenceCap(
        result.value.date,
        recurrenceSelection,
        subBudgetWindow.endDate,
      )
    ) {
      setErrorKey('budget.validation.RECURRENCE_EXCEEDS_BUDGET');
      return;
    }

    setIsSaving(true);
    setErrorKey(null);

    try {
      const bilingualDescription = await createBilingualText(description, locale);
      const expenseId = generateExpenseId();

      let attachmentUrl: string | undefined;
      if (attachmentFile) {
        try {
          attachmentUrl = await uploadExpenseAttachment(userId, expenseId, attachmentFile);
        } catch (err) {
          if (err instanceof Error && err.message === 'FILE_TOO_LARGE') {
            setErrorKey('addExpense.attachmentTooLarge');
          } else {
            setErrorKey('addExpense.attachmentError');
          }
          setIsSaving(false);
          return;
        }
      }

      let expense: Expense = {
        id: expenseId,
        description: bilingualDescription,
        amount: result.value.amount,
        category: result.value.category,
        date: result.value.date,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
        ...(attachmentUrl ? { attachmentUrl } : {}),
        ...(recurrenceRule ? { recurrenceRule } : {}),
        ...(shouldScheduleOneTimeExpense(
          { date: result.value.date, hasRecurrenceRule: Boolean(recurrenceRule) },
          todayIso,
        )
          ? { scheduled: true }
          : {}),
        ...(isMaster ? {} : { budgetId: activeBudgetId }),
      };

      if (recurrenceRule) {
        const finalized = finalizeRecurrenceSchedule(expense, {
          capEndDateIso: !isMaster && subBudgetWindow ? subBudgetWindow.endDate : undefined,
        });
        if (!finalized.ok) {
          setErrorKey(`budget.validation.${finalized.error}`);
          setIsSaving(false);
          return;
        }
        expense = finalized.expense;
      }

      await createExpense(expense);
      closeFlow();
    } catch {
      setErrorKey('expense.validation.translationError');
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedSubCategoryId,
    note,
    amountDigits,
    date,
    paymentMethod,
    recurrenceSelection,
    attachmentFile,
    todayIso,
    i18n.language,
    userId,
    createExpense,
    closeFlow,
    isMaster,
    activeBudgetId,
    subBudgetWindow,
  ]);

  return {
    open,
    step,
    selectedSubCategoryId,
    amountDigits,
    setAmountDigits,
    note,
    setNote,
    date,
    setDate,
    paymentMethod,
    setPaymentMethod,
    recurrenceSelection,
    setRecurrenceSelection,
    attachmentFile,
    setAttachmentFile,
    isSaving,
    errorKey,
    openFlow,
    closeFlow,
    selectSubCategory,
    goBackToCategories,
    submit,
  };
}
