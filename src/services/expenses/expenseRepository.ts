import { type Expense, type RecurrencePendingBasicFields } from '../../types/expense';
import { GUEST_FINANCE_STORAGE_KEYS } from '../../config/storage/guestKeys';
import { SUPABASE_TABLES } from '../../config/supabase/tables';
import { wrapLegacyText } from '../../domain/i18n/buildBilingualText';
import { migrateCategoryId } from '../../domain/categories/constants';
import {
  DEFAULT_PAYMENT_METHOD,
  isPaymentMethodId,
} from '../../domain/expenses/paymentMethods';
import { parseExpenseDateToIso, isIsoDateString } from '../../domain/expenses/parseExpenseDate';
import { validateRecurrenceRule } from '../../domain/recurrence/validateRecurrenceRule';
import { RECURRENCE_TYPES, type RecurrenceRule } from '../../types/recurrenceRule';
import { resolveAuthAttachmentUrl } from '../attachments/expenseAttachmentService';
import { supabase } from '../supabase/client';
import { throwIfPostgrestError } from '../supabase/errors';
import { expenseRowToRaw, expenseToRow, type ExpenseRow } from './expenseRowMapper';

const GUEST_EXPENSES_KEY = GUEST_FINANCE_STORAGE_KEYS.expenses;

export type LoadExpensesError = 'NOT_FOUND' | 'CORRUPTED_EXPENSES' | 'INVALID_EXPENSES';

function isValidRawExpense(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  const hasDescription =
    typeof obj.description === 'string' ||
    (typeof obj.description === 'object' &&
      obj.description !== null &&
      typeof (obj.description as Record<string, unknown>).en === 'string' &&
      typeof (obj.description as Record<string, unknown>).he === 'string');

  return (
    typeof obj.id === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.category === 'string' &&
    typeof obj.date === 'string' &&
    hasDescription
  );
}

function parseRecurrenceRule(raw: unknown): RecurrenceRule | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;
  const type = obj.type;
  const interval = obj.interval;

  if (typeof type !== 'string' || !RECURRENCE_TYPES.includes(type as RecurrenceRule['type'])) {
    return undefined;
  }
  if (typeof interval !== 'number' || !Number.isInteger(interval)) {
    return undefined;
  }

  const rule: RecurrenceRule = { type: type as RecurrenceRule['type'], interval, occurrences: null };

  if (Array.isArray(obj.customDays)) {
    rule.customDays = obj.customDays.filter((d): d is number => typeof d === 'number');
  }

  if (obj.occurrences === null) {
    rule.occurrences = null;
  } else if (typeof obj.occurrences === 'number' && Number.isInteger(obj.occurrences)) {
    rule.occurrences = obj.occurrences;
  }

  if (validateRecurrenceRule(rule) !== null) return undefined;
  return rule;
}

function parseOptionalId(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : undefined;
}

function parseRecurrencePendingBasicFields(raw: unknown): RecurrencePendingBasicFields | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.effectiveFromIso !== 'string' || !isIsoDateString(obj.effectiveFromIso)) {
    return undefined;
  }
  if (typeof obj.amount !== 'number') return undefined;
  if (typeof obj.category !== 'string') return undefined;
  if (typeof obj.paymentMethod !== 'string' || !isPaymentMethodId(obj.paymentMethod)) {
    return undefined;
  }

  const descriptionRaw = obj.description;
  if (
    typeof descriptionRaw !== 'object' ||
    descriptionRaw === null ||
    typeof (descriptionRaw as Record<string, unknown>).en !== 'string' ||
    typeof (descriptionRaw as Record<string, unknown>).he !== 'string'
  ) {
    return undefined;
  }

  const originalCategoryId = parseOptionalId(obj.originalCategoryId);
  const originalSubCategoryId = parseOptionalId(obj.originalSubCategoryId);

  return {
    effectiveFromIso: obj.effectiveFromIso,
    description: descriptionRaw as RecurrencePendingBasicFields['description'],
    amount: obj.amount,
    category: migrateCategoryId(obj.category),
    paymentMethod: obj.paymentMethod,
    ...(originalCategoryId ? { originalCategoryId } : {}),
    ...(originalSubCategoryId ? { originalSubCategoryId } : {}),
  };
}

export function migrateExpense(raw: Record<string, unknown>): Expense {
  const description =
    typeof raw.description === 'string'
      ? wrapLegacyText(raw.description)
      : (raw.description as Expense['description']);

  const rawPaymentMethod = typeof raw.paymentMethod === 'string' ? raw.paymentMethod : DEFAULT_PAYMENT_METHOD;
  const recurrenceRule = parseRecurrenceRule(raw.recurrenceRule);
  const recurrenceSeriesId =
    typeof raw.recurrenceSeriesId === 'string' ? raw.recurrenceSeriesId : undefined;
  const recurrenceEndDate =
    typeof raw.recurrenceEndDate === 'string' && isIsoDateString(raw.recurrenceEndDate)
      ? raw.recurrenceEndDate
      : undefined;
  const recurrenceExcludedDates = Array.isArray(raw.recurrenceExcludedDates)
    ? raw.recurrenceExcludedDates.filter(
        (date): date is string => typeof date === 'string' && isIsoDateString(date),
      )
    : undefined;
  const recurrencePendingBasicFields = parseRecurrencePendingBasicFields(
    raw.recurrencePendingBasicFields,
  );
  const scheduled = raw.scheduled === true ? true : undefined;

  const originalCategoryId = parseOptionalId(raw.originalCategoryId);
  const originalSubCategoryId = parseOptionalId(raw.originalSubCategoryId);
  const budgetId = typeof raw.budgetId === 'string' ? raw.budgetId : undefined;

  return {
    id: raw.id as string,
    description,
    amount: raw.amount as number,
    category: migrateCategoryId(raw.category as string),
    date: parseExpenseDateToIso(raw.date as string),
    paymentMethod: isPaymentMethodId(rawPaymentMethod) ? rawPaymentMethod : DEFAULT_PAYMENT_METHOD,
    ...(typeof raw.attachmentUrl === 'string' && raw.attachmentUrl.length > 0
      ? { attachmentUrl: raw.attachmentUrl }
      : {}),
    ...(recurrenceRule ? { recurrenceRule } : {}),
    ...(recurrenceSeriesId ? { recurrenceSeriesId } : {}),
    ...(recurrenceEndDate ? { recurrenceEndDate } : {}),
    ...(recurrenceExcludedDates && recurrenceExcludedDates.length > 0
      ? { recurrenceExcludedDates }
      : {}),
    ...(recurrencePendingBasicFields ? { recurrencePendingBasicFields } : {}),
    ...(scheduled ? { scheduled } : {}),
    ...(originalCategoryId ? { originalCategoryId } : {}),
    ...(originalSubCategoryId ? { originalSubCategoryId } : {}),
    ...(budgetId ? { budgetId } : {}),
  };
}

function loadGuestExpenses(): Expense[] {
  const raw = localStorage.getItem(GUEST_EXPENSES_KEY);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('CORRUPTED_EXPENSES');
  }

  if (!Array.isArray(parsed)) throw new Error('INVALID_EXPENSES');
  if (!parsed.every(isValidRawExpense)) throw new Error('INVALID_EXPENSES');

  return parsed.map(migrateExpense);
}

function saveGuestExpenses(expenses: Expense[]): void {
  localStorage.setItem(GUEST_EXPENSES_KEY, JSON.stringify(expenses));
}

export function clearGuestExpenses(): void {
  localStorage.removeItem(GUEST_EXPENSES_KEY);
}

async function loadAuthExpenses(userId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.expenses)
    .select('*')
    .eq('user_id', userId);
  throwIfPostgrestError(error, 'LOAD_EXPENSES_FAILED');

  const expenses = await Promise.all(
    (data as ExpenseRow[]).map(async (row) => {
      const expense = migrateExpense(expenseRowToRaw(row));
      if (!expense.attachmentUrl) return expense;
      const attachmentUrl = await resolveAuthAttachmentUrl(
        userId,
        expense.id,
        expense.attachmentUrl,
      );
      return attachmentUrl ? { ...expense, attachmentUrl } : expense;
    }),
  );

  return expenses.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

async function applyAuthExpenseBatch(userId: string, nextExpenses: Expense[]): Promise<void> {
  const { data, error } = await supabase
    .from(SUPABASE_TABLES.expenses)
    .select('id')
    .eq('user_id', userId);
  throwIfPostgrestError(error, 'LOAD_EXPENSES_FAILED');

  const nextIds = new Set(nextExpenses.map((expense) => expense.id));
  const toDelete = (data ?? [])
    .map((row) => row.id as string)
    .filter((id) => !nextIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from(SUPABASE_TABLES.expenses)
      .delete()
      .eq('user_id', userId)
      .in('id', toDelete);
    throwIfPostgrestError(deleteError, 'SAVE_EXPENSES_FAILED');
  }

  if (nextExpenses.length === 0) return;

  const { error: upsertError } = await supabase
    .from(SUPABASE_TABLES.expenses)
    .upsert(nextExpenses.map((expense) => expenseToRow(userId, expense)), {
      onConflict: 'user_id,id',
    });
  throwIfPostgrestError(upsertError, 'SAVE_EXPENSES_FAILED');
}

export async function loadExpenses(userId: string | null): Promise<Expense[]> {
  if (userId) return loadAuthExpenses(userId);
  return loadGuestExpenses();
}

export async function saveExpense(userId: string | null, expense: Expense): Promise<void> {
  if (userId) {
    const { error } = await supabase
      .from(SUPABASE_TABLES.expenses)
      .upsert(expenseToRow(userId, expense), { onConflict: 'user_id,id' });
    throwIfPostgrestError(error, 'SAVE_EXPENSE_FAILED');
    return;
  }

  const current = loadGuestExpenses();
  saveGuestExpenses([expense, ...current.filter((item) => item.id !== expense.id)]);
}

export async function applyExpenseBatch(
  userId: string | null,
  nextExpenses: Expense[],
): Promise<void> {
  if (userId) {
    await applyAuthExpenseBatch(userId, nextExpenses);
    return;
  }

  saveGuestExpenses(nextExpenses);
}

export async function reassignExpensesCategory(
  userId: string | null,
  fromCategoryId: string,
  toCategoryId: string,
): Promise<void> {
  const expenses = await loadExpenses(userId);
  const hasMatches = expenses.some((expense) => expense.category === fromCategoryId);
  if (!hasMatches) return;

  const updated = expenses.map((expense) =>
    expense.category === fromCategoryId ? { ...expense, category: toCategoryId } : expense,
  );
  await applyExpenseBatch(userId, updated);
}

export async function deleteExpense(userId: string | null, expenseId: string): Promise<void> {
  if (userId) {
    const { error } = await supabase
      .from(SUPABASE_TABLES.expenses)
      .delete()
      .eq('user_id', userId)
      .eq('id', expenseId);
    throwIfPostgrestError(error, 'DELETE_EXPENSE_FAILED');
    return;
  }

  const current = loadGuestExpenses();
  saveGuestExpenses(current.filter((expense) => expense.id !== expenseId));
}
