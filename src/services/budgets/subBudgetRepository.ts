import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../../config/firebase/collections';
import { db } from '../firebase';
import { parseBudgetStoreValue } from '../../domain/budget/parseBudgetStore';
import { type BudgetStore, type SubBudgetRecord } from '../../types/budget';

const GUEST_SUB_BUDGETS_KEY = 'subBudgets';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseLabels(v: unknown): { en: string; he: string } | null {
  if (!isRecord(v)) return null;
  if (typeof v.en !== 'string' || typeof v.he !== 'string') return null;
  return { en: v.en, he: v.he };
}

function parseMonthOverrides(v: unknown): BudgetStore | null {
  if (v === undefined) return {};
  const parsed = parseBudgetStoreValue(v);
  return parsed.ok ? parsed.value : null;
}

/**
 * Legacy documents (pre-kind) are date-bounded and linked to the monthly budget,
 * so missing `kind` => 'temporary' and missing `includeInMonthlyBudget` => true.
 */
function parseSubBudget(v: unknown, fallbackSortOrder: number): SubBudgetRecord | null {
  if (!isRecord(v)) return null;
  const labels = parseLabels(v.name);
  if (
    typeof v.id !== 'string' ||
    !labels ||
    (typeof v.totalAmount !== 'number' && v.totalAmount !== null) ||
    typeof v.createdAt !== 'string'
  ) {
    return null;
  }

  const base = {
    id: v.id,
    name: labels,
    totalAmount: v.totalAmount,
    includeInMonthlyBudget: v.includeInMonthlyBudget !== false,
    sortOrder: typeof v.sortOrder === 'number' ? v.sortOrder : fallbackSortOrder,
    createdAt: v.createdAt,
    ...(v.purgedFromHistory === true ? { purgedFromHistory: true } : {}),
  };

  if (v.kind === 'fixed') {
    const monthOverrides = parseMonthOverrides(v.monthOverrides);
    if (monthOverrides === null) return null;
    return { ...base, kind: 'fixed', monthOverrides };
  }

  if (v.kind !== undefined && v.kind !== 'temporary') return null;
  if (typeof v.startDate !== 'string' || typeof v.endDate !== 'string') return null;

  return { ...base, kind: 'temporary', startDate: v.startDate, endDate: v.endDate };
}

function loadGuestSubBudgets(): SubBudgetRecord[] {
  const raw = localStorage.getItem(GUEST_SUB_BUDGETS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item, index) => parseSubBudget(item, index))
      .filter((item): item is SubBudgetRecord => item !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    throw new Error('CORRUPTED_SUB_BUDGETS');
  }
}

function saveGuestSubBudgets(budgets: SubBudgetRecord[]): void {
  localStorage.setItem(GUEST_SUB_BUDGETS_KEY, JSON.stringify(budgets));
}

function userSubBudgetsRef(firestoreDb: Firestore, userId: string) {
  return collection(
    firestoreDb,
    FIRESTORE_COLLECTIONS.users,
    userId,
    FIRESTORE_COLLECTIONS.budgets,
  );
}

async function loadAuthSubBudgets(userId: string): Promise<SubBudgetRecord[]> {
  const snap = await getDocs(userSubBudgetsRef(db, userId));
  return snap.docs
    .map((d, index) => parseSubBudget(d.data(), index))
    .filter((item): item is SubBudgetRecord => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function loadSubBudgets(userId: string | null): Promise<SubBudgetRecord[]> {
  if (userId) return loadAuthSubBudgets(userId);
  return loadGuestSubBudgets();
}

export async function saveSubBudget(
  userId: string | null,
  budget: SubBudgetRecord,
): Promise<void> {
  if (userId) {
    const ref = doc(userSubBudgetsRef(db, userId), budget.id);
    await setDoc(ref, budget);
    return;
  }

  const current = loadGuestSubBudgets();
  const index = current.findIndex((item) => item.id === budget.id);
  if (index >= 0) {
    current[index] = budget;
  } else {
    current.push(budget);
  }
  saveGuestSubBudgets(current);
}

export async function deleteSubBudget(
  userId: string | null,
  budgetId: string,
): Promise<void> {
  if (userId) {
    const ref = doc(userSubBudgetsRef(db, userId), budgetId);
    await deleteDoc(ref);
    return;
  }

  const current = loadGuestSubBudgets().filter((item) => item.id !== budgetId);
  saveGuestSubBudgets(current);
}

export async function saveSubBudgetsOrder(
  userId: string | null,
  budgets: SubBudgetRecord[],
): Promise<void> {
  if (userId) {
    const batch = writeBatch(db);
    for (const budget of budgets) {
      const ref = doc(userSubBudgetsRef(db, userId), budget.id);
      batch.set(ref, budget);
    }
    await batch.commit();
    return;
  }

  const byId = new Map(budgets.map((budget) => [budget.id, budget]));
  const current = loadGuestSubBudgets().map((budget) => byId.get(budget.id) ?? budget);
  saveGuestSubBudgets(current);
}
