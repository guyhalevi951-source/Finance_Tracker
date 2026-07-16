import {
  collection,
  doc,
  getDocs,
  writeBatch,
  setDoc,
  deleteDoc,
  type Firestore,
} from 'firebase/firestore';
import { type Expense } from '../../types/expense';
import { FIRESTORE_COLLECTIONS } from '../../config/firebase/collections';
import { wrapLegacyText } from '../../domain/i18n/buildBilingualText';
import { migrateCategoryId } from '../../domain/categories/constants';
import {
  DEFAULT_PAYMENT_METHOD,
  isPaymentMethodId,
} from '../../domain/expenses/paymentMethods';
import { parseExpenseDateToIso } from '../../domain/expenses/parseExpenseDate';
import { db } from '../firebase';

const GUEST_EXPENSES_KEY = 'expenses';

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

export function migrateExpense(raw: Record<string, unknown>): Expense {
  const description =
    typeof raw.description === 'string'
      ? wrapLegacyText(raw.description)
      : (raw.description as Expense['description']);

  const rawPaymentMethod = typeof raw.paymentMethod === 'string' ? raw.paymentMethod : DEFAULT_PAYMENT_METHOD;

  return {
    id: raw.id as string,
    description,
    amount: raw.amount as number,
    category: migrateCategoryId(raw.category as string),
    date: parseExpenseDateToIso(raw.date as string),
    paymentMethod: isPaymentMethodId(rawPaymentMethod) ? rawPaymentMethod : DEFAULT_PAYMENT_METHOD,
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

function userExpensesRef(firestoreDb: Firestore, userId: string) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.expenses,
  );
}

async function loadAuthExpenses(userId: string): Promise<Expense[]> {
  const snap = await getDocs(userExpensesRef(db, userId));
  return snap.docs
    .map((d) => migrateExpense(d.data() as Record<string, unknown>))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

async function applyAuthExpenseBatch(userId: string, nextExpenses: Expense[]): Promise<void> {
  const snap = await getDocs(userExpensesRef(db, userId));
  const existingIds = new Set(snap.docs.map((d) => d.id));
  const nextIds = new Set(nextExpenses.map((e) => e.id));

  const batch = writeBatch(db);

  for (const docSnap of snap.docs) {
    if (!nextIds.has(docSnap.id)) {
      batch.delete(docSnap.ref);
    }
  }

  for (const expense of nextExpenses) {
    const ref = doc(userExpensesRef(db, userId), expense.id);
    batch.set(ref, expense);
    existingIds.delete(expense.id);
  }

  await batch.commit();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function loadExpenses(userId: string | null): Promise<Expense[]> {
  if (userId) return loadAuthExpenses(userId);
  return loadGuestExpenses();
}

export async function saveExpense(userId: string | null, expense: Expense): Promise<void> {
  if (userId) {
    const ref = doc(userExpensesRef(db, userId), expense.id);
    await setDoc(ref, expense);
    return;
  }

  const current = loadGuestExpenses();
  saveGuestExpenses([expense, ...current.filter((e) => e.id !== expense.id)]);
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

export async function deleteExpense(userId: string | null, expenseId: string): Promise<void> {
  if (userId) {
    const ref = doc(userExpensesRef(db, userId), expenseId);
    await deleteDoc(ref);
    return;
  }

  const current = loadGuestExpenses();
  saveGuestExpenses(current.filter((e) => e.id !== expenseId));
}
