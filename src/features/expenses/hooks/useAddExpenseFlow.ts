import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { validateExpenseInput } from '../../../domain/expenses/validateExpense';
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
import { toIsoDate } from '../../../domain/expenses/parseExpenseDate';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { uploadExpenseAttachment } from '../../../services/attachments/expenseAttachmentService';
import { type AppLocale } from '../../../config/app';

export type AddExpenseStep = 'category' | 'entry';

export interface UseAddExpenseFlowOptions {
  userId: string | null;
  createExpense: (expense: Expense) => Promise<void>;
}

export function useAddExpenseFlow({ userId, createExpense }: UseAddExpenseFlowOptions) {
  const { i18n } = useTranslation();
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

    const result = validateExpenseInput({
      description,
      amount: amountDigits === '' ? '0' : amountDigits,
      category: selectedSubCategoryId,
      paymentMethod,
      date,
    });

    if (!result.ok) {
      setErrorKey(`expense.validation.${result.error}`);
      return;
    }

    const recurrenceError = validateRecurrenceSelection(recurrenceSelection);
    if (recurrenceError) {
      setErrorKey(`addExpense.validation.${recurrenceError}`);
      return;
    }

    const recurrenceRule = selectionToRule(recurrenceSelection);

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

      const expense: Expense = {
        id: expenseId,
        description: bilingualDescription,
        amount: result.value.amount,
        category: result.value.category,
        date: result.value.date,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
        ...(attachmentUrl ? { attachmentUrl } : {}),
        ...(recurrenceRule ? { recurrenceRule } : {}),
      };

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
    i18n.language,
    userId,
    createExpense,
    closeFlow,
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
