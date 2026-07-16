import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { type Expense } from '../../../types/expense';
import { validateExpenseInput } from '../../../domain/expenses/validateExpense';
import { generateExpenseId } from '../../../domain/expenses/generateId';
import { DEFAULT_PAYMENT_METHOD } from '../../../domain/expenses/paymentMethods';
import { toIsoDate } from '../../../domain/expenses/parseExpenseDate';
import { getSubCategoryI18nKey } from '../../../domain/categories/hierarchy';
import { createBilingualText } from '../../../services/translation/createBilingualText';
import { uploadExpenseAttachment } from '../../../services/attachments/expenseAttachmentService';
import { type AppLocale } from '../../../config/app';

export type AddExpenseStep = 'category' | 'entry';

export interface UseAddExpenseFlowOptions {
  userId: string | null;
  createExpense: (expense: Expense) => Promise<void>;
}

export function useAddExpenseFlow({ userId, createExpense }: UseAddExpenseFlowOptions) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<AddExpenseStep>('category');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | null>(null);
  const [amountDigits, setAmountDigits] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('category');
    setSelectedSubCategoryId(null);
    setAmountDigits('');
    setNote('');
    setDate(toIsoDate(new Date()));
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
    const description =
      note.trim() !== ''
        ? note.trim()
        : t(getSubCategoryI18nKey(selectedSubCategoryId));

    const result = validateExpenseInput({
      description,
      amount: amountDigits === '' ? '0' : amountDigits,
      category: selectedSubCategoryId,
      paymentMethod: DEFAULT_PAYMENT_METHOD,
      date,
    });

    if (!result.ok) {
      setErrorKey(`expense.validation.${result.error}`);
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

      const expense: Expense = {
        id: expenseId,
        description: bilingualDescription,
        amount: result.value.amount,
        category: result.value.category,
        date: result.value.date,
        paymentMethod: result.value.paymentMethod as Expense['paymentMethod'],
        ...(attachmentUrl ? { attachmentUrl } : {}),
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
    attachmentFile,
    i18n.language,
    t,
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
